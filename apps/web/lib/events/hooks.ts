'use client';

import { useQuery } from '@tanstack/react-query';

import type { EventsQuery } from '@events/shared-types';

import {
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

export function useEvent(id: number) {
  return useQuery(eventQueryOptions(id));
}

export function useTags() {
  return useQuery(tagsQueryOptions());
}
