'use client';

import { Suspense } from 'react';

import { useEventSuspense } from '@/lib/events/hooks';

import { EventArticles } from './event-articles';
import { EventArticlesSkeleton } from './event-detail-skeleton';
import { EventHero } from './event-hero';
import { EventMeta } from './event-meta';
import { EventTicket } from './event-ticket';

export function EventDetail({ id }: { id: number }) {
  const { data } = useEventSuspense(id);
  const event = data.event;

  return (
    <div className="grid grid-cols-1 items-start gap-[38px] lg:grid-cols-[1fr_350px]">
      <div>
        <EventHero event={event} />
        <EventMeta event={event} />
        <Suspense fallback={<EventArticlesSkeleton />}>
          <EventArticles eventId={id} />
        </Suspense>
      </div>
      <EventTicket event={event} />
    </div>
  );
}
