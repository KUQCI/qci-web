import { useEffect, useRef, type CSSProperties } from 'react';
import { formatEventDate, formatEventTime, isPastEvent, type SerializedEvent } from './types';

interface EventTimelineProps {
  events: SerializedEvent[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

function getStatusBadgeClass(status: SerializedEvent['status']) {
  if (status === 'Upcoming') {
    return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300';
  }

  return 'border-gold-duck/25 text-gold-duck';
}

export default function EventTimeline({
  events,
  selectedSlug,
  onSelect,
  onNext,
  onPrevious
}: EventTimelineProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hasPositionedInitialCardRef = useRef(false);
  const selectedIndex = events.findIndex((event) => event.slug === selectedSlug);
  const trackStyle = {
    '--event-card-width': 'min(42rem, calc(100vw - 3rem))',
    '--event-card-gap': '5rem',
    '--event-track-pad': 'max(1rem, calc((100% - var(--event-card-width)) / 2))',
    '--event-arrow-offset': 'max(0.75rem, calc((100% - var(--event-card-width)) / 2 - 3.75rem))'
  } as CSSProperties;
  const selectorStyle = {
    paddingInline: 'var(--event-track-pad)',
    scrollPaddingInline: 'var(--event-track-pad)'
  } as CSSProperties;
  const timelineMaskStyle = {
    maskImage:
      'linear-gradient(to right, transparent 0, black clamp(1rem, 9vw, 3.5rem), black calc(100% - clamp(1rem, 9vw, 3.5rem)), transparent 100%)',
    WebkitMaskImage:
      'linear-gradient(to right, transparent 0, black clamp(1rem, 9vw, 3.5rem), black calc(100% - clamp(1rem, 9vw, 3.5rem)), transparent 100%)'
  } as CSSProperties;

  useEffect(() => {
    const selectedCard = scrollerRef.current?.querySelector<HTMLElement>(`[data-event-card="${selectedSlug}"]`);
    selectedCard?.scrollIntoView({
      behavior: hasPositionedInitialCardRef.current ? 'smooth' : 'auto',
      inline: 'center',
      block: 'nearest'
    });
    hasPositionedInitialCardRef.current = true;
  }, [selectedSlug]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNext();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onPrevious();
    }
  };

  return (
    <section className="min-w-0 max-w-full scroll-mt-32" aria-label="Event timeline" onKeyDown={onKeyDown}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="mono-label text-xs uppercase text-cyan-quantum/75">timeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Schedule</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrevious}
            className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-quantum/20 text-slate-100 transition hover:border-gold-duck/50 hover:text-gold-duck"
            aria-label="Select previous event"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-quantum/20 text-slate-100 transition hover:border-gold-duck/50 hover:text-gold-duck"
            aria-label="Select next event"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
      </div>

      <div>
        <div className="relative max-w-full overflow-hidden" style={{ ...trackStyle, ...timelineMaskStyle }}>
          <div className="absolute bottom-5 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-quantum/30 to-transparent" />
          <button
            type="button"
            onClick={onPrevious}
            className="absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-xl border border-cyan-quantum/20 bg-ink/88 text-slate-100 shadow-blue-glow backdrop-blur transition hover:border-gold-duck/50 hover:text-gold-duck lg:grid"
            style={{ left: 'var(--event-arrow-offset)' }}
            aria-label="Previous event"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-xl border border-cyan-quantum/20 bg-ink/88 text-slate-100 shadow-blue-glow backdrop-blur transition hover:border-gold-duck/50 hover:text-gold-duck lg:grid"
            style={{ right: 'var(--event-arrow-offset)' }}
            aria-label="Next event"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
          <div
            ref={scrollerRef}
            className="no-scrollbar relative flex w-full max-w-full snap-x gap-[var(--event-card-gap)] overflow-x-auto overscroll-x-contain pb-12 scroll-smooth"
            style={selectorStyle}
            tabIndex={0}
            aria-label="Event timeline selector"
          >
            {events.map((event, index) => {
              const selected = event.slug === selectedSlug;
              const past = isPastEvent(event);
              const eventTime = formatEventTime(event);
              const distance = selectedIndex === -1 ? 0 : Math.abs(index - selectedIndex);
              const inactiveState =
                distance === 1
                  ? 'scale-95 opacity-50 saturate-75'
                  : 'scale-90 opacity-20 saturate-50 blur-[0.3px]';

              return (
                <article
                  key={event.slug}
                  data-event-card={event.slug}
                  className={[
                    'relative min-h-[27rem] w-[var(--event-card-width)] shrink-0 snap-center rounded-2xl border bg-gradient-to-br p-5 text-left scroll-mt-32 transition duration-300 ease-out sm:p-6',
                    selected
                      ? 'z-10 scale-100 border-gold-duck/55 from-surface-2 to-ink opacity-100 shadow-gold-glow'
                      : `border-cyan-quantum/14 from-surface/80 to-ink/70 ${inactiveState} hover:border-cyan-quantum/35 hover:opacity-75 hover:blur-none`,
                    past && !selected ? 'brightness-90' : ''
                  ].join(' ')}
                  aria-current={selected ? 'true' : undefined}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono-label rounded-full border border-blue-qci/35 px-2.5 py-1 text-xs uppercase text-cyan-quantum">
                        {event.type}
                      </span>
                      <span
                        className={[
                          'mono-label rounded-full border px-2.5 py-1 text-xs uppercase',
                          getStatusBadgeClass(event.status)
                        ].join(' ')}
                      >
                        {event.status}
                      </span>
                      {event.difficulty && (
                        <span className="mono-label rounded-full border border-slate-600 px-2.5 py-1 text-xs uppercase text-slate-300">
                          {event.difficulty}
                        </span>
                      )}
                    </div>
                    {!selected && (
                      <button
                        type="button"
                        onClick={() => onSelect(event.slug)}
                        className="rounded-full border border-cyan-quantum/25 px-3 py-1.5 text-xs font-semibold text-cyan-quantum transition hover:border-gold-duck/50 hover:text-gold-duck"
                        aria-label={`Select ${event.title}, ${formatEventDate(event.date, event.endDate)}`}
                      >
                        Select
                      </button>
                    )}
                  </div>
                  <h3 className="mt-5 break-words text-2xl font-semibold text-white sm:text-3xl">{event.title}</h3>
                  <dl className="mt-6 grid gap-3 text-sm text-slate-300">
                    <div className="flex justify-between gap-4 border-t border-cyan-quantum/10 pt-3">
                      <dt className="text-slate-500">Date</dt>
                      <dd className="text-right">{formatEventDate(event.date, event.endDate)}</dd>
                    </div>
                    {eventTime && (
                      <div className="flex justify-between gap-4 border-t border-cyan-quantum/10 pt-3">
                        <dt className="text-slate-500">Time</dt>
                        <dd className="min-w-0 break-words text-right">{eventTime}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4 border-t border-cyan-quantum/10 pt-3">
                      <dt className="text-slate-500">Location</dt>
                      <dd className="min-w-0 break-words text-right">{event.location}</dd>
                    </div>
                  </dl>
                  <p className="mt-6 break-words leading-8 text-slate-300">{event.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span key={tag} className="mono-label rounded-full bg-blue-qci/10 px-2.5 py-1 text-xs text-cyan-quantum">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    {event.registrationUrl && !past ? (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex justify-center rounded-2xl border border-gold-duck bg-gold-duck px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#ffd46f]"
                      >
                        Register
                      </a>
                    ) : (
                      <span className="inline-flex justify-center rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-400">
                        {past ? 'Registration unavailable' : 'Registration upcoming'}
                      </span>
                    )}
                  </div>
                  <span
                    className={[
                      'absolute -bottom-7 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border',
                      selected
                        ? 'border-gold-duck bg-gold-duck shadow-gold-glow'
                        : 'border-cyan-quantum/45 bg-surface-2'
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
