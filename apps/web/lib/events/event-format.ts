import type { Event } from '@events/shared-types';

/**
 * Shared event presentation helpers (used by the list card and the detail page).
 * All date formatters are pinned to UTC so server and client render identical
 * strings — no hydration mismatch.
 */

export const POSTERS = [
  'linear-gradient(150deg,#ff3d8b,#ff8a3d)',
  'linear-gradient(150deg,#7b5cff,#3dcbff)',
  'linear-gradient(150deg,#cdff3a,#19c39c)',
  'linear-gradient(150deg,#1c1a26,#3a2150)',
];

/** Deterministic by id so an event always renders the same colour. */
export const posterFor = (id: number) => POSTERS[id % POSTERS.length];

const fmt = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...o });

export const monthDayFmt = fmt({ month: 'short', day: 'numeric' }); // AUG 15
export const weekdayFmt = fmt({ weekday: 'short', month: 'short', day: 'numeric' }); // Fri Aug 15
export const timeFmt = fmt({ hour: '2-digit', minute: '2-digit', hour12: false }); // 18:00

export interface EventStatus {
  label: string;
  variant: 'badge-up' | 'badge-live' | 'badge-sold' | 'badge-past';
  live: boolean;
}

export function statusOf(event: Event, now: number): EventStatus {
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  const soldOut = event.maxGuests > 0 && event.registeredCount >= event.maxGuests;

  if (now >= start && now <= end)
    return { label: 'Live', variant: 'badge-live', live: true };
  if (end < now) return { label: 'Past', variant: 'badge-past', live: false };
  if (soldOut) return { label: 'Sold out', variant: 'badge-sold', live: false };
  return { label: 'Upcoming', variant: 'badge-up', live: false };
}

export function capacityOf(event: Event) {
  const pct =
    event.maxGuests > 0
      ? Math.min(
          100,
          Math.round((event.registeredCount / event.maxGuests) * 100),
        )
      : 0;
  const label =
    event.maxGuests > 0
      ? `${event.registeredCount} / ${event.maxGuests}`
      : `${event.registeredCount} / ∞`;
  const barColor = pct >= 100 ? 'bg-live' : pct >= 90 ? 'bg-warning' : 'bg-primary';
  return { pct, label, barColor, full: event.maxGuests > 0 && pct >= 100 };
}
