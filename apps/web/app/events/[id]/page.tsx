import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { ApiError } from '@events/api-client';

import { EventDetail } from '@/components/events/detail/event-detail';
import { EventDetailSkeleton } from '@/components/events/detail/event-detail-skeleton';
import { eventArticlesQueryOptions } from '@/lib/articles/queries';
import { getServerToken } from '@/lib/auth/token.server';
import { eventQueryOptions } from '@/lib/events/queries';
import { getQueryClient } from '@/lib/get-query-client';

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const token = await getServerToken();
  const queryClient = getQueryClient();

  // Await the event itself so a missing id renders a real 404; the related
  // articles stay un-awaited so they stream into their own <Suspense>.
  try {
    await queryClient.fetchQuery(eventQueryOptions(id, token));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  void queryClient.prefetchQuery(eventArticlesQueryOptions(id, token));

  return (
    <main>
      <section className="pt-[54px] pb-20">
        <div className="wrap">
          <div className="eyebrow mb-4">Event</div>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<EventDetailSkeleton />}>
              <EventDetail id={id} />
            </Suspense>
          </HydrationBoundary>
        </div>
      </section>
    </main>
  );
}
