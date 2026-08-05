import { expect, test, type Page } from '@playwright/test';

const routes = [
  { path: '/', heading: 'Quantum Computing Initiative' },
  { path: '/events', heading: 'Events' },
  { path: '/rd', heading: 'Contributing to the Quantum Ecosystem.' }
] as const;

type Diagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  badResponses: string[];
};

function captureDiagnostics(page: Page): Diagnostics {
  const diagnostics: Diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: []
  };
  const isLocalPreviewUrl = (url: string) => {
    try {
      const { hostname } = new URL(url);
      return hostname === '127.0.0.1' || hostname === 'localhost';
    } catch {
      return false;
    }
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(error.message);
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (isLocalPreviewUrl(url)) {
      diagnostics.failedRequests.push(`${request.method()} ${url}: ${request.failure()?.errorText ?? 'failed'}`);
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    if (isLocalPreviewUrl(url) && response.status() >= 400) {
      diagnostics.badResponses.push(`${response.status()} ${url}`);
    }
  });

  return diagnostics;
}

async function expectNoClientFailures(page: Page, diagnostics: Diagnostics) {
  await page.waitForTimeout(250);

  expect(diagnostics.consoleErrors, 'browser console errors').toEqual([]);
  expect(diagnostics.pageErrors, 'uncaught browser errors').toEqual([]);
  expect(diagnostics.failedRequests, 'failed same-origin requests').toEqual([]);
  expect(diagnostics.badResponses, 'bad same-origin responses').toEqual([]);
}

async function expectAstroIslandsHydrated(page: Page) {
  const islandCount = await page.locator('astro-island').count();

  if (islandCount === 0) {
    return;
  }

  await expect
    .poll(() => page.locator('astro-island[ssr]').count(), {
      message: 'all Astro islands should hydrate and remove the ssr marker',
      timeout: 15_000
    })
    .toBe(0);
}

async function expectModuleAssetsHaveJavaScriptMime(page: Page) {
  const moduleUrls = await page.evaluate(() => {
    const scriptUrls = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'))
      .map((script) => script.src)
      .filter(Boolean);
    const islandUrls = Array.from(document.querySelectorAll('astro-island')).flatMap((island) => [
      island.getAttribute('component-url'),
      island.getAttribute('renderer-url')
    ]);

    return Array.from(new Set([...scriptUrls, ...islandUrls].filter(Boolean).map((url) => new URL(url!, location.href).href)));
  });

  for (const url of moduleUrls) {
    const response = await page.request.get(url);
    const contentType = response.headers()['content-type'] ?? '';

    expect(response.ok(), `${url} should load successfully`).toBe(true);
    expect(contentType, `${url} should be served as JavaScript`).toMatch(/javascript|ecmascript/);
  }
}

async function expectNoDocumentOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(dimensions.scrollWidth, 'document should not horizontally overflow the viewport').toBeLessThanOrEqual(
    dimensions.clientWidth + 2
  );
}

async function expectInternalLinksReachable(page: Page) {
  const internalLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .map((link) => new URL(link.href, location.href))
      .filter((url) => url.origin === location.origin)
      .map((url) => `${url.origin}${url.pathname}`)
      .filter((url, index, all) => all.indexOf(url) === index);
  });

  for (const url of internalLinks) {
    const response = await page.request.get(url);
    expect(response.status(), `${url} should not return an error`).toBeLessThan(400);
  }
}

async function expectHeroRippleIsAnimating(page: Page) {
  const ripple = page.locator('[data-hero-ripple="0"]');
  await expect(ripple).toBeAttached();

  const readRippleRadius = () =>
    ripple.evaluate((element) => {
      const ellipse = element as SVGEllipseElement;
      return ellipse.rx.animVal.value;
    });

  const initialRadius = await readRippleRadius();
  await page.waitForTimeout(700);
  const nextRadius = await readRippleRadius();

  expect(Math.abs(nextRadius - initialRadius), 'hero pond ripple should animate on mobile browsers').toBeGreaterThan(2);
}

for (const route of routes) {
  test(`${route.path} renders, hydrates, and loads client assets`, async ({ page }) => {
    const diagnostics = captureDiagnostics(page);

    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
    await expectAstroIslandsHydrated(page);
    await expectModuleAssetsHaveJavaScriptMime(page);
    await expectNoDocumentOverflow(page);
    await expectInternalLinksReachable(page);
    await expectNoClientFailures(page, diagnostics);
  });
}

test('home hero and navbar scripts remain interactive', async ({ page }) => {
  const diagnostics = captureDiagnostics(page);

  await page.goto('/', { waitUntil: 'networkidle' });
  await expectAstroIslandsHydrated(page);
  await expect(page.getByRole('img', { name: /abstract quantum pond/i })).toBeVisible();

  await page.mouse.move(120, 160);
  await page.mouse.move(620, 260);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.5));
  await expect(page.locator('[data-navbar]')).toHaveClass(/navbar-visible/);

  await expectNoClientFailures(page, diagnostics);
});

test('mobile hero SVG animations run on touch browsers', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'touch-browser animation is covered in mobile projects');

  const diagnostics = captureDiagnostics(page);

  await page.goto('/', { waitUntil: 'networkidle' });
  await expectAstroIslandsHydrated(page);
  await expectHeroRippleIsAnimating(page);
  await page.touchscreen.tap(300, 260);

  await expectNoClientFailures(page, diagnostics);
});

test('mobile scroll reveal activates on about and R&D pages', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'mobile scroll reveal is covered in mobile projects');

  const diagnostics = captureDiagnostics(page);
  const revealTargets = [
    { path: '/', selector: '#mission [data-scroll-reveal="section"]' },
    { path: '/rd', selector: 'main > section:nth-of-type(2) [data-scroll-reveal="section"]' }
  ];

  for (const target of revealTargets) {
    await page.goto(target.path, { waitUntil: 'networkidle' });
    const revealElement = page.locator(target.selector).first();
    await revealElement.scrollIntoViewIfNeeded();
    await expect(revealElement).toHaveAttribute('data-reveal-visible', 'true');
  }

  await expectNoClientFailures(page, diagnostics);
});

test('events island filters, timeline, and calendar stay synchronized', async ({ page }) => {
  const diagnostics = captureDiagnostics(page);

  await page.goto('/events', { waitUntil: 'networkidle' });
  await expectAstroIslandsHydrated(page);

  const selectedTitle = page.locator('[data-event-card][aria-current="true"] h3');
  await expect(selectedTitle).toHaveText('Quantum Computing Initiative IBM Qiskit Fall Fest 2026');

  await page.getByRole('button', { name: 'Select previous event' }).click();
  await expect(selectedTitle).toHaveText('AUS MedHack QCI Booth');

  await page.getByRole('button', { name: 'Show next month' }).click();
  await expect(page.getByRole('heading', { name: 'June 2026' })).toBeVisible();
  await expect(selectedTitle).toHaveText('AUS MedHack QCI Booth');

  const showcaseFilter = page.getByRole('button', { name: 'Showcase' });
  await showcaseFilter.click();
  await expect(showcaseFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(selectedTitle).toHaveText('AUS MedHack QCI Booth');

  await expect(page.getByRole('button', { name: /Add .* to calendar/ })).toHaveCount(0);
  await expectNoClientFailures(page, diagnostics);
});

test('events timeline supports keyboard navigation', async ({ page }) => {
  const diagnostics = captureDiagnostics(page);

  await page.goto('/events', { waitUntil: 'networkidle' });
  await expectAstroIslandsHydrated(page);

  const selectedTitle = page.locator('[data-event-card][aria-current="true"] h3');
  await expect(selectedTitle).toHaveText('Quantum Computing Initiative IBM Qiskit Fall Fest 2026');

  await page.getByLabel('Event timeline selector').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(selectedTitle).toHaveText('AUS MedHack QCI Booth');
  await page.keyboard.press('ArrowRight');
  await expect(selectedTitle).toHaveText('Quantum Computing Initiative IBM Qiskit Fall Fest 2026');

  await expectNoClientFailures(page, diagnostics);
});

test('mobile navigation opens, closes, and navigates', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'mobile navigation is covered in the mobile browser project');

  const diagnostics = captureDiagnostics(page);

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.5));

  const menu = page.locator('[data-menu]');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();

  await menu.getByRole('link', { name: 'Events' }).click();
  await expect(page).toHaveURL(/\/events\/?$/);
  await expect(page.getByRole('heading', { name: 'Events' }).first()).toBeVisible();

  await expectNoClientFailures(page, diagnostics);
});
