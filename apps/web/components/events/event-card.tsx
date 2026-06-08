import Link from 'next/link';

import { Calendar, MapPin, Star } from 'lucide-react';

import type { Event } from '@events/shared-types';

/** Shared by the real grid and the skeleton so they line up exactly. */
export const eventsGridClassName =
  'grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-5';

/**
 * Poster gradients from the mockup, picked deterministically by id so a given
 * event always renders the same colour (and server/client render identically).
 */
const POSTERS = [
  'linear-gradient(150deg,#ff3d8b,#ff8a3d)',
  'linear-gradient(150deg,#7b5cff,#3dcbff)',
  'linear-gradient(150deg,#cdff3a,#19c39c)',
  'linear-gradient(150deg,#1c1a26,#3a2150)',
];

// Fixed UTC formatting → no server/client hydration mismatch on dates.
const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const timeFmt = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function statusOf(event: Event, now: number) {
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  const soldOut = event.maxGuests > 0 && event.registeredCount >= event.maxGuests;

  if (now >= start && now <= end)
    return { label: 'Live', variant: 'badge-live', live: true };
  if (end < now) return { label: 'Past', variant: 'badge-past', live: false };
  if (soldOut) return { label: 'Sold out', variant: 'badge-sold', live: false };
  return { label: 'Upcoming', variant: 'badge-up', live: false };
}

export function EventCard({ event }: { event: Event }) {
  const start = new Date(event.startDate);
  const status = statusOf(event, Date.now());

  const pct =
    event.maxGuests > 0
      ? Math.min(100, Math.round((event.registeredCount / event.maxGuests) * 100))
      : 0;
  const capLabel =
    event.maxGuests > 0
      ? `${event.registeredCount} / ${event.maxGuests}`
      : `${event.registeredCount} / ∞`;
  const barColor = pct >= 100 ? 'bg-live' : pct >= 90 ? 'bg-warning' : 'bg-primary';

  return (
    <Link
      href={`/events/${event.id}`}
      className="card block overflow-hidden transition duration-150 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]"
    >
      <div
        className="relative flex aspect-[4/5] flex-col justify-between p-[18px] text-white"
        style={{ backgroundImage: POSTERS[event.id % POSTERS.length] }}
      >
        <span className="self-start rounded-[8px] bg-black/30 px-2.5 py-[5px] font-mono text-[0.72rem] font-bold tracking-[0.08em] backdrop-blur-sm">
          {dateFmt.format(start).toUpperCase()}
        </span>
        <h3 className="anton text-[2.3rem] leading-[0.9]">{event.title}</h3>
      </div>

      <div className="flex flex-col gap-3 p-[16px_18px_18px]">
        <div className="flex items-center justify-between gap-2">
          <span className={`badge ${status.variant}`}>
            {status.live && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            )}
            {status.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[0.82rem] text-rating">
            <Star width={14} height={14} fill="currentColor" stroke="none" />
            <span className="font-mono text-[0.76rem] text-muted-foreground">
              {event.rating.toFixed(1)}
            </span>
          </span>
        </div>

        <div className="metarow">
          <span className="inline-flex items-center gap-1.5">
            <Calendar width={15} height={15} />
            <span className="font-mono text-[0.78rem]">{timeFmt.format(start)}</span>
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin width={15} height={15} />
              {event.location}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[0.74rem] text-muted-foreground">
            <span>Going</span>
            <span>{capLabel}</span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-full bg-elevated">
            <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
