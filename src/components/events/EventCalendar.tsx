import {
  formatMonth,
  isPastEvent,
  toLocalDate,
  type SerializedEvent
} from './types';

interface EventCalendarProps {
  events: SerializedEvent[];
  selectedEvent: SerializedEvent;
  visibleMonth: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (slug: string) => void;
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + index);
    return cell;
  });
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
    2,
    '0'
  )}`;
}

function getEventEndDate(event: SerializedEvent) {
  return event.endDate ? toLocalDate(event.endDate) : toLocalDate(event.date);
}

function eventOccursOnDate(event: SerializedEvent, dateKey: string) {
  const date = toLocalDate(dateKey);
  const start = toLocalDate(event.date);
  const end = getEventEndDate(event);

  return date >= start && date <= end;
}

function eventOverlapsMonth(event: SerializedEvent, month: Date) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const eventStart = toLocalDate(event.date);
  const eventEnd = getEventEndDate(event);

  return eventStart <= monthEnd && eventEnd >= monthStart;
}

export default function EventCalendar({
  events,
  selectedEvent,
  visibleMonth,
  onMonthChange,
  onSelect
}: EventCalendarProps) {
  const monthEvents = events.filter((event) => eventOverlapsMonth(event, visibleMonth));
  const cells = getCalendarCells(visibleMonth);

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-cyan-quantum/14 bg-surface/70 p-3 sm:p-5" aria-label="Event calendar">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="mono-label text-xs uppercase text-cyan-quantum/75">calendar</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{formatMonth(visibleMonth)}</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(visibleMonth, -1))}
            className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-quantum/20 transition hover:border-gold-duck/50 hover:text-gold-duck"
            aria-label="Show previous month"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(visibleMonth, 1))}
            className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-quantum/20 transition hover:border-gold-duck/50 hover:text-gold-duck"
            aria-label="Show next month"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-7 gap-1 text-center sm:gap-2">
        {weekdays.map((day) => (
          <div key={day} className="mono-label py-2 text-[0.68rem] uppercase text-slate-500">
            {day}
          </div>
        ))}
        {cells.map((cell) => {
          const dateKey = toDateKey(cell);
          const dayEvents = monthEvents.filter((event) => eventOccursOnDate(event, dateKey));
          const inMonth = cell.getMonth() === visibleMonth.getMonth();
          const selected = eventOccursOnDate(selectedEvent, dateKey);

          if (dayEvents.length === 0) {
            return (
              <div
                key={dateKey}
                className={[
                  'min-h-14 rounded-xl border border-transparent p-1.5 text-sm sm:min-h-16 sm:p-2',
                  inMonth ? 'text-slate-500' : 'text-slate-700'
                ].join(' ')}
              >
                {cell.getDate()}
              </div>
            );
          }

          const primaryEvent = dayEvents[0];
          const past = dayEvents.every(isPastEvent);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelect(primaryEvent.slug)}
              className={[
                'relative min-h-14 rounded-xl border p-1.5 text-left text-sm transition hover:border-gold-duck/45 sm:min-h-16 sm:p-2',
                selected
                  ? 'animate-pulse border-cyan-quantum bg-gold-duck/10 text-white'
                  : 'border-cyan-quantum/20 bg-blue-qci/5 text-slate-200',
                past ? 'opacity-60' : 'opacity-100'
              ].join(' ')}
              aria-label={`Select ${primaryEvent.title} on ${dateKey}`}
            >
              <span className="font-semibold">{cell.getDate()}</span>
              <span className="mt-2 flex items-center gap-1.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.slug}
                        className={selected ? 'h-2 w-2 rounded-full bg-gold-duck' : 'h-2 w-2 rounded-full bg-cyan-quantum'}
                        aria-hidden="true"
                      />
                    ))}
              </span>
              <span className="sr-only">{dayEvents.map((event) => `${event.type}: ${event.title}`).join(', ')}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
