import { queryOptions } from '@tanstack/react-query';

import { api, ApiError } from '@events/api-client';

/**
 * Query keys + `queryOptions` factories for auth.
 *
 * The queryOptions pattern keeps the key, the fetcher and its config in ONE
 * object that is reused on the server (prefetch) and the client (useQuery) —
 * so they can never drift apart. This file is framework-agnostic (no hooks),
 * which is why a Server Component can import it for prefetching.
 */
export const authKeys = {
  currentUser: ['auth', 'me'] as const,
};

export function currentUserQueryOptions(token: string | null | undefined) {
  return queryOptions({
    queryKey: authKeys.currentUser,
    queryFn: async () => {
      // No token → definitely logged out; don't even hit the API.
      if (!token) return null;
      try {
        const { user } = await api.auth.me({ token });
        return user;
      } catch (error) {
        // Expired/invalid token is "logged out", not an error to surface.
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    // Identity rarely changes mid-session; keep it fresh for 5 min.
    staleTime: 5 * 60_000,
  });
}
