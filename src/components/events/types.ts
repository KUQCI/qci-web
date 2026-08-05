export type EventType = 'Workshop' | 'Hackathon' | 'Talk' | 'Bootcamp' | 'Showcase' | 'Festival';
export type EventStatus = 'Upcoming' | 'Past' | 'Registration Open' | 'In Progress';
export type EventDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Beginner to Advanced';

export interface SerializedEvent {
  slug: string;
  title: string;
  type: EventType;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  timeLabel?: string;
  location: string;
  difficulty?: EventDifficulty;
  status: EventStatus;
  tags: string[];
  registrationUrl?: string;
  summary: string;
}

export function toLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function eventMonthKey(event: SerializedEvent) {
  return monthKey(toLocalDate(event.date));
}

export function formatEventDate(date: string, endDate?: string) {
  const startDate = toLocalDate(date);

  if (!endDate) {
    return new Intl.DateTimeFormat('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(startDate);
  }

  const end = toLocalDate(endDate);
  const formattedStart = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(startDate);
  const formattedEnd = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(end);

  return `${formattedStart} - ${formattedEnd}`;
}

export function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatEventTime(event: SerializedEvent) {
  if (event.timeLabel) {
    return event.timeLabel;
  }

  if (!event.startTime) {
    return undefined;
  }

  return event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime;
}

export function isPastEvent(event: SerializedEvent) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return event.status === 'Past' || toLocalDate(event.endDate ?? event.date) < today;
}
