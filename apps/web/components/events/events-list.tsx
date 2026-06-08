'use client';

import { EventsQuery } from '@events/shared-types';

import { EventCard, eventsGridClassName } from '@/components/events/event-card';
import { useEventsSuspense } from '@/lib/events/hooks';

export function EventsList({ query }: { query: EventsQuery }) {
  const { data } = useEventsSuspense(query);
  const { events } = data;

  if (events.length === 0) {
    return (
      <p className="py-16 text-center font-mono text-[0.85rem] text-muted-foreground">
        No events found.
      </p>
    );
  }

  return (
    <div className={eventsGridClassName}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
