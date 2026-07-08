// our amazing website
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const BLOCH_CENTER = 360;
const STATE_VECTOR_BASE_ANGLE =
  (Math.atan2(270 - BLOCH_CENTER, 480 - BLOCH_CENTER) * 180) / Math.PI;
const STATE_VECTOR_ARROW_PATH =
  'M358.9 358.6 L459 282 L454 275 L480 270 L467 292 L462 285 L361.1 361.4 Z';

type SphereOrbital = {
  rx: number;
  ry: number;
  stroke: string;
  strokeOpacity: number;
  baseAngle: number;
  duration: number;
  direction: 1 | -1;
};

const sphereOrbitals = [
  {
    rx: 212,
    ry: 78,
    stroke: '#7dd3fc',
    strokeOpacity: 0.36,
    baseAngle: 18,
    duration: 44,
    direction: 1
  },
  {
    rx: 212,
    ry: 78,
    stroke: '#2f80ed',
    strokeOpacity: 0.28,
    baseAngle: -48,
    duration: 58,
    direction: -1
  },
  {
    rx: 212,
    ry: 78,
    stroke: '#7dd3fc',
    strokeOpacity: 0.22,
    baseAngle: 78,
    duration: 70,
    direction: 1
  },
  {
    rx: 212,
    ry: 78,
    stroke: '#2f80ed',
    strokeOpacity: 0.24,
    baseAngle: -82,
    duration: 50,
    direction: -1
  }
] as const satisfies readonly SphereOrbital[];

export default function PondHero() {
  const reduceMotion = useReducedMotion();
  const graphicRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastVectorRotationRef = useRef<number | null>(null);
  const orbitalLayoutRef = useRef<Array<{ phaseDelay: number; planeAngle: number }> | null>(null);
  const [cursorVectorRotation, setCursorVectorRotation] = useState<number | null>(null);

  if (orbitalLayoutRef.current === null) {
    const elapsedSeconds =
      typeof performance === 'undefined' ? Date.now() / 1000 : performance.now() / 1000;
    const directionCounts = sphereOrbitals.reduce<Record<1 | -1, number>>(
      (counts, orbital) => {
        counts[orbital.direction] += 1;
        return counts;
      },
      { 1: 0, '-1': 0 }
    );
    const directionSeen: Record<1 | -1, number> = { 1: 0, '-1': 0 };
    const directionStartPhase: Record<1 | -1, number> = {
      1: Math.random(),
      '-1': Math.random()
    };

    orbitalLayoutRef.current = sphereOrbitals.map((orbital) => {
      const groupIndex = directionSeen[orbital.direction];
      const groupCount = directionCounts[orbital.direction];
      const jitter = (Math.random() - 0.5) * 0.08;
      const phase = (directionStartPhase[orbital.direction] + groupIndex / groupCount + jitter + 1) % 1;
      const phaseDelay = -((elapsedSeconds + phase * orbital.duration) % orbital.duration);
      const planeAngle = orbital.baseAngle + (Math.random() - 0.5) * 22;

      directionSeen[orbital.direction] += 1;

      return { phaseDelay, planeAngle };
    });
  }

  const orbitalLayout = orbitalLayoutRef.current;
  const pulse = reduceMotion ? {} : { opacity: [0.32, 0.88, 0.32], scale: [1, 1.05, 1] };
  const pointerStateVectorTransition = {
    type: 'spring' as const,
    stiffness: 90,
    damping: 20,
    mass: 0.45
  };
  const stateVectorAnimate = { rotate: cursorVectorRotation ?? -24 };
  const stateVectorTransition =
    cursorVectorRotation === null ? { duration: 0 } : pointerStateVectorTransition;

  useEffect(() => {
    const unwrapToNearestRotation = (targetRotation: number) => {
      const previousRotation = lastVectorRotationRef.current;

      if (previousRotation === null) {
        lastVectorRotationRef.current = targetRotation;
        return targetRotation;
      }

      const delta = ((((targetRotation - previousRotation) % 360) + 540) % 360) - 180;
      const nextRotation = previousRotation + delta;
      lastVectorRotationRef.current = nextRotation;
      return nextRotation;
    };

    const pointStateVectorAt = (x: number, y: number) => {
      const rect = graphicRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      const dx = x - originX;
      const dy = y - originY;

      if (Math.hypot(dx, dy) < 8) {
        return;
      }

      const cursorAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      setCursorVectorRotation(unwrapToNearestRotation(cursorAngle - STATE_VECTOR_BASE_ANGLE));
    };

    const rememberAndPointAt = (x: number, y: number) => {
      lastPointerRef.current = { x, y };
      pointStateVectorAt(x, y);
    };

    const handlePointerMove = (event: PointerEvent) => {
      rememberAndPointAt(event.clientX, event.clientY);
    };

    const handlePointerDown = (event: PointerEvent) => {
      rememberAndPointAt(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0] ?? event.changedTouches[0];

      if (!touch) {
        return;
      }

      rememberAndPointAt(touch.clientX, touch.clientY);
    };

    const updateFromLastPointer = () => {
      if (lastPointerRef.current) {
        pointStateVectorAt(lastPointerRef.current.x, lastPointerRef.current.y);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', updateFromLastPointer, { passive: true });
    window.addEventListener('resize', updateFromLastPointer);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', updateFromLastPointer);
      window.removeEventListener('resize', updateFromLastPointer);
    };
  }, []);

  return (
    <section
      id="top"
      className="relative isolate flex min-h-screen min-h-[100svh] items-center justify-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      <motion.div
        className="absolute inset-0 bg-radial-pond"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.2 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(125,211,252,0.06),transparent_34rem)]" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52svh] bg-gradient-to-t from-[#050914] via-[#050914]/76 to-transparent"
        aria-hidden="true"
      />

      <div className="section-shell relative z-10 grid min-h-screen min-h-[100svh] items-start justify-items-center pb-10 pt-14 sm:place-items-center sm:py-24">
        <div
          className="relative mx-auto w-full max-w-[min(92vw,30rem)] sm:aspect-square sm:max-w-[720px] sm:-translate-y-14 md:max-w-[780px] md:-translate-y-20"
        >
          <div ref={graphicRef} className="relative aspect-square w-full sm:absolute sm:inset-0" data-hero-graphic>
          <motion.svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 720 720"
            role="img"
            aria-label="Abstract quantum pond with a minimal duck and Bloch sphere arcs"
            initial={false}
          >
            <defs>
              <radialGradient id="pondGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2f80ed" stopOpacity="0.22" />
                <stop offset="55%" stopColor="#7dd3fc" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#050914" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="cyanLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2f80ed" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.78" />
                <stop offset="100%" stopColor="#2f80ed" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="duckDown" x1="0" y1="0" x2="0.9" y2="1">
                <stop offset="0%" stopColor="#fff3a3" />
                <stop offset="48%" stopColor="#f6d766" />
                <stop offset="100%" stopColor="#eab84d" />
              </linearGradient>
              <filter id="softGoldGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="stateVectorGlow"
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="outerBlur" />
                <feFlood floodColor="#f6c453" floodOpacity="0.82" result="outerColor" />
                <feComposite in="outerColor" in2="outerBlur" operator="in" result="outerGlow" />
                <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="innerBlur" />
                <feFlood floodColor="#ffe08a" floodOpacity="0.72" result="innerColor" />
                <feComposite in="innerColor" in2="innerBlur" operator="in" result="innerGlow" />
                <feMerge>
                  <feMergeNode in="outerGlow" />
                  <feMergeNode in="innerGlow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx="360" cy="360" r="280" fill="url(#pondGlow)" />

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.35, duration: reduceMotion ? 0 : 1 }}
            >
              {[0, 1, 2].map((ring) => (
                <ellipse
                  key={ring}
                  data-hero-ripple={ring}
                  cx="360"
                  cy="392"
                  rx="48"
                  ry="12"
                  fill="none"
                  stroke={ring === 1 ? '#7dd3fc' : '#2f80ed'}
                  opacity={reduceMotion ? 0.24 : 0}
                  strokeOpacity={0.34}
                  strokeWidth="1.4"
                >
                  {!reduceMotion && (
                    <>
                      <animate
                        attributeName="rx"
                        values="48;220"
                        dur="10.6s"
                        begin={`${-(ring * 3.53)}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="ry"
                        values="12;56"
                        dur="10.6s"
                        begin={`${-(ring * 3.53)}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0.42;0.18;0"
                        keyTimes="0;0.34;0.72;1"
                        dur="10.6s"
                        begin={`${-(ring * 3.53)}s`}
                        repeatCount="indefinite"
                      />
                    </>
                  )}
                </ellipse>
              ))}
            </motion.g>

            <g>
              <ellipse
                cx="360"
                cy="360"
                rx="212"
                ry="212"
                fill="none"
                stroke="url(#cyanLine)"
                strokeDasharray="5 10"
                strokeOpacity="0.32"
                strokeWidth="1.2"
              />
              {sphereOrbitals.map((orbital, index) => (
                <ellipse
                  key={`${orbital.rx}-${orbital.ry}-${orbital.baseAngle}`}
                  data-hero-orbital={index}
                  cx="360"
                  cy="360"
                  rx={orbital.rx}
                  ry={orbital.ry}
                  fill="none"
                  stroke={orbital.stroke}
                  strokeOpacity={orbital.strokeOpacity}
                  strokeWidth="1.2"
                  transform={`rotate(${orbitalLayout[index].planeAngle} 360 360)`}
                >
                  {!reduceMotion && (
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="rotate"
                      from="0 360 360"
                      to={`${orbital.direction * 360} 360 360`}
                      dur={`${orbital.duration}s`}
                      begin={`${orbitalLayout[index].phaseDelay}s`}
                      repeatCount="indefinite"
                      additive="sum"
                    />
                  )}
                </ellipse>
              ))}
              <path
                d="M360 148 L360 572"
                fill="none"
                stroke="#7dd3fc"
                strokeDasharray="2 12"
                strokeOpacity="0.22"
              />
              <path
                d="M148 360 L572 360"
                fill="none"
                stroke="#7dd3fc"
                strokeDasharray="2 12"
                strokeOpacity="0.18"
              />
            </g>

            <motion.g
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.12, duration: reduceMotion ? 0 : 0.82, ease: 'easeOut' }}
            >
              <motion.g
                style={{ transformBox: 'view-box', transformOrigin: '360px 360px' }}
                animate={stateVectorAnimate}
                transition={stateVectorTransition}
              >
                <path
                  d={STATE_VECTOR_ARROW_PATH}
                  fill="#f6c453"
                  opacity="0.88"
                  filter="url(#stateVectorGlow)"
                />
                <path
                  d={STATE_VECTOR_ARROW_PATH}
                  fill="#f6c453"
                  stroke="#f6c453"
                  strokeOpacity="0.45"
                  strokeWidth="0.6"
                  strokeLinejoin="round"
                />
                <motion.circle
                  cx="480"
                  cy="270"
                  r="3"
                  fill="none"
                  stroke="#f6c453"
                  strokeWidth="1.5"
                  filter="url(#softGoldGlow)"
                  animate={reduceMotion ? {} : { r: [3, 10, 3], opacity: [0, 0.45, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.circle
                  cx="480"
                  cy="270"
                  r="3"
                  fill="#f6c453"
                  filter="url(#softGoldGlow)"
                  animate={reduceMotion ? {} : { r: [2.5, 3.8, 2.5], opacity: [0.62, 0.92, 0.62] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.g>
              <circle cx="360" cy="360" r="4.5" fill="#f6c453" opacity="0.92" />
            </motion.g>

            <g className="mono-label" aria-hidden="true">
              <text x="349" y="142" fill="#7dd3fc" fillOpacity="0.58" fontSize="16">
                |0&gt;
              </text>
              <text x="350" y="594" fill="#7dd3fc" fillOpacity="0.36" fontSize="16">
                |1&gt;
              </text>
              <text x="579" y="364" fill="#7dd3fc" fillOpacity="0.34" fontSize="13">
                x
              </text>
            </g>

            <g data-hero-duck>
              {!reduceMotion && (
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  values="0 0; 0 -4; 0 0"
                  dur="3.8s"
                  repeatCount="indefinite"
                />
              )}
              <ellipse cx="360" cy="415" rx="76" ry="14" fill="#2f80ed" opacity="0.2" />
              <image
                x="220"
                y="200"
                width="280"
                height="260"
                href="/Quanta version_1_backgroundless.png"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>

            {[['360', '148'], ['360', '572'], ['178', '360'], ['542', '360']].map(([cx, cy], index) => (
              <motion.circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={index < 2 ? '4' : '3'}
                fill="#7dd3fc"
                animate={pulse}
                transition={{ duration: 3.4, repeat: Infinity, delay: index * 0.25, ease: 'easeInOut' }}
              />
            ))}
          </motion.svg>

          </div>

          <motion.div
            className="relative z-10 -mt-16 mx-auto max-w-3xl px-4 text-center sm:absolute sm:inset-x-0 sm:bottom-0 sm:mt-0 md:bottom-3"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.82, ease: 'easeOut' }}
          >
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-x-[-0.5rem] bottom-[-0.75rem] top-[-0.75rem] -z-10 rounded-[1.75rem] bg-[#050914]/28 backdrop-blur-md [mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)] sm:inset-x-[-1.5rem]"
                aria-hidden="true"
              />
              <p className="mono-label mb-4 text-xs font-semibold uppercase text-cyan-quantum/80">
                Khalifa University
              </p>
              <h1 id="hero-title" className="text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl md:text-7xl">
                Quantum Computing Initiative
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 md:mt-5 md:text-xl md:leading-8">
                Prepare for the future by building it.
              </p>
              <p className="mono-label mt-7 flex flex-col items-center justify-center gap-2 text-xs uppercase text-slate-500 md:mt-10">
                <span>Scroll to enter</span>
                <motion.svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-slate-500"
                  viewBox="0 0 16 16"
                  fill="none"
                  animate={reduceMotion ? {} : { y: [0, 3, 0], opacity: [0.45, 0.8, 0.45] }}
                  transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path
                    d="M8 2.5V12M4.25 8.25 8 12l3.75-3.75"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
