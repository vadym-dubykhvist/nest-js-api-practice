import {
  defaultShouldDehydrateQuery,
  environmentManager,
  QueryClient,
} from '@tanstack/react-query';

/**
 * One QueryClient factory shared by the server (per-request) and the browser
 * (singleton). This is the official TanStack pattern for the Next.js App Router
 * — getting it wrong leaks one user's cache into another's SSR render.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        // Also dehydrate still-pending queries — needed only if you later adopt
        // streaming / useSuspenseQuery. Harmless for plain prefetch.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (environmentManager.isServer()) {
    // Server: a brand-new client every request so caches never bleed across users.
    return makeQueryClient();
  }
  // Browser: reuse a single client across renders and Suspense remounts.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
