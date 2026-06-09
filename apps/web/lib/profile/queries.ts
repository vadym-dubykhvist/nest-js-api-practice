import { queryOptions } from '@tanstack/react-query';

import { api } from '@events/api-client';

/**
 * Profile query keys + factory. Token-aware like eventQueryOptions: the server
 * passes the cookie token at prefetch and the client hook passes the browser
 * token, so `following` is computed for the right viewer. Same key both sides
 * (the token only affects the fetcher); queryClient.clear() on logout drops it.
 */
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (username: string) => ['profiles', 'detail', username] as const,
};

export function profileQueryOptions(username: string, token?: string | null) {
  return queryOptions({
    queryKey: profileKeys.detail(username),
    queryFn: () => api.profiles.get(username, token ? { token } : undefined),
    enabled: !!username,
  });
}
