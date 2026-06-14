import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { ApiError } from '@events/api-client';

import { EventDetail } from '@/components/events/detail/event-detail';
import { EventNotFound } from '@/components/events/detail/event-not-found';
import { eventArticlesQueryOptions } from '@/lib/articles/queries';
import { getServerToken } from '@/lib/auth/token.server';
import { loadEvent } from '@/lib/events/load-event.server';
import { eventKeys } from '@/lib/events/queries';
import { getQueryClient } from '@/lib/get-query-client';

/**
 * Dynamic island for the event detail. It awaits params and reads the auth
 * cookie + fetches the event — all dynamic — so it lives INSIDE the page's
 * <Suspense>: the shell stays static (the page never touches params, so PPR
 * prerenders it) and, since this async server component awaits, the skeleton
 * fallback actually streams.
 *
 * A missing or malformed event renders <EventNotFound /> inline (soft 404 —
 * status stays 200 since the shell already streamed). We deliberately don't
 * call notFound() here: during streaming it doubles up with Next's default
 * not-found UI. loadEvent is deduped with generateMetadata, so it's one request.
 */
export async function EventDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return <EventNotFound />;

  const token = await getServerToken();

  try {
    const { event } = await loadEvent(id, token);

    const queryClient = getQueryClient();
    queryClient.setQueryData(eventKeys.detail(id), { event });
    void queryClient.prefetchQuery(eventArticlesQueryOptions(id, token));

    // Stamp "now" on the server so the client's first render of the status
    // badges matches the server HTML (see useNow) — no hydration mismatch.
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EventDetail id={id} serverNow={Date.now()} />
      </HydrationBoundary>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return <EventNotFound />;
    throw error;
  }
}
