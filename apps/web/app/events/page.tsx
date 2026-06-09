import { Suspense } from 'react';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import EventsFilter from '@/components/events/events-filter';
import { EventsGridSkeleton } from '@/components/events/events-grid-skeleton';
import { EventsList } from '@/components/events/events-list';
import { EventsPagination } from '@/components/events/events-pagination';
import { eventsQueryOptions, tagsQueryOptions } from '@/lib/events/queries';
import {
  type EventsSearchParams,
  parseEventsSearchParams,
} from '@/lib/events/search-params';
import { getQueryClient } from '@/lib/get-query-client';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<EventsSearchParams>;
}) {
  const { page, query } = parseEventsSearchParams(await searchParams);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tagsQueryOptions());
  void queryClient.prefetchQuery(eventsQueryOptions(query));

  return (
    <main>
      <section id="events" className="pt-[54px]">
        <div className="wrap">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <div className="mb-[30px] flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="eyebrow">This week</div>
                <h2 className="anton mt-0.5 text-[69px]">
                  What&apos;s
                  <br />
                  on <em className="not-italic text-primary">now.</em>
                </h2>
              </div>
              <Suspense
                fallback={
                  <div className="h-[42px] w-[180px] animate-pulse rounded-[12px] bg-elevated" />
                }
              >
                <EventsPagination page={page} query={query} />
              </Suspense>
            </div>

            <EventsFilter />

            <Suspense fallback={<EventsGridSkeleton />}>
              <EventsList query={query} serverNow={Date.now()} />
            </Suspense>
          </HydrationBoundary>
        </div>
      </section>
    </main>
  );
}
