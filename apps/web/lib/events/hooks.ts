'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';

import { api } from '@events/api-client';
import type {
  CreateEventInput,
  EventResponse,
  EventsQuery,
  EventsResponse,
  RegisterEventInput,
  TagsResponse,
  UpdateEventInput,
} from '@events/shared-types';

import { getToken } from '@/lib/auth/token';
import {
  eventKeys,
  eventQueryOptions,
  eventsQueryOptions,
  tagsQueryOptions,
} from '@/lib/events/queries';

/**
 * Client hooks = thin wrappers over the shared queryOptions. Consumption only;
 * the definitions (key + fetcher) live in lib/events/queries.ts so the server
 * can prefetch them too.
 */
export function useEvents(query?: EventsQuery) {
  return useQuery(eventsQueryOptions(query));
}

export function useEventsSuspense(
  query?: EventsQuery,
): UseSuspenseQueryResult<EventsResponse, Error> {
  return useSuspenseQuery(eventsQueryOptions(query));
}

export function useEvent(id: number) {
  return useQuery(eventQueryOptions(id, getToken()));
}

export function useEventSuspense(
  id: number,
): UseSuspenseQueryResult<EventResponse, Error> {
  // Token from the cookie so the per-user fields (registered, myRating) match
  // what the server prefetched. Same key as the server → reads the hydrated cache.
  return useSuspenseQuery(eventQueryOptions(id, getToken()));
}

export function useTags(): UseSuspenseQueryResult<TagsResponse, Error> {
  return useSuspenseQuery(tagsQueryOptions());
}

/**
 * Counters (registeredCount, rating, registered, myRating) are denormalized
 * onto the event, so every mutation just invalidates the events tree — the
 * active detail observer refetches with its token, and list cards refresh too.
 */
function useEventInvalidation() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: eventKeys.all });
}

/** Create an event (authenticated). Invalidates the events tree on success. */
export function useCreateEvent() {
  const invalidate = useEventInvalidation();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      api.events.create(input, { token: getToken() ?? undefined }),
    onSuccess: invalidate,
  });
}

/** Update an event (author only — the backend 403s otherwise). */
export function useUpdateEvent(id: number) {
  const invalidate = useEventInvalidation();
  return useMutation({
    mutationFn: (input: UpdateEventInput) =>
      api.events.update(id, input, { token: getToken() ?? undefined }),
    onSuccess: invalidate,
  });
}

/** Register works for guests (email+name in input) and authed users (token). */
export function useRegisterEvent(id: number) {
  const invalidate = useEventInvalidation();
  return useMutation({
    mutationFn: (input: RegisterEventInput) => {
      const token = getToken();
      return api.events.register(id, input, token ? { token } : undefined);
    },
    onSuccess: invalidate,
  });
}

/** Cancel registration — authenticated users only. */
export function useUnregisterEvent(id: number) {
  const invalidate = useEventInvalidation();
  return useMutation({
    mutationFn: () =>
      api.events.cancelRegistration(id, { token: getToken() ?? undefined }),
    onSuccess: invalidate,
  });
}

/**
 * Rate (POST first time, PATCH to change) — authenticated users only.
 * Optimistic: the star widget reads event.myRating, so we patch the cached
 * detail immediately, roll back on error, and reconcile the real average +
 * ratingsCount on settle.
 */
export function useRateEvent(id: number) {
  const queryClient = useQueryClient();
  const key = eventKeys.detail(id);

  return useMutation({
    mutationFn: ({ score, hasRated }: { score: number; hasRated: boolean }) => {
      const opts = { token: getToken() ?? undefined };
      return hasRated
        ? api.events.updateRating(id, { score }, opts)
        : api.events.rate(id, { score }, opts);
    },
    onMutate: async ({ score, hasRated }) => {
      // Stop any in-flight detail refetch from clobbering the optimistic write.
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<EventResponse>(key);
      queryClient.setQueryData<EventResponse>(key, (old) =>
        old
          ? {
              event: {
                ...old.event,
                myRating: score,
                ratingsCount: hasRated
                  ? old.event.ratingsCount
                  : (old.event.ratingsCount ?? 0) + 1,
              },
            }
          : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    // Reconcile the average rating (which we can't compute client-side) and
    // counts with the server, regardless of success/failure.
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
}
