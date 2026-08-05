import { formatEventDate, formatEventTime, isPastEvent, type SerializedEvent } from './types';

interface EventDetailsProps {
  event: SerializedEvent;
}

function getStatusBadgeClass(status: SerializedEvent['status']) {
  if (status === 'Upcoming') {
    return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300';
  }

  return 'border-gold-duck/25 text-gold-duck';
}

export default function EventDetails({ event }: EventDetailsProps) {
  const past = isPastEvent(event);
  const eventTime = formatEventTime(event);

  return (
    <aside className="min-w-0 max-w-full rounded-2xl border border-gold-duck/20 bg-gradient-to-br from-surface-2 to-ink p-5 shadow-gold-glow sm:p-6">
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

      <h2 className="mt-5 break-words text-3xl font-semibold text-white">{event.title}</h2>
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
    </aside>
  );
}
