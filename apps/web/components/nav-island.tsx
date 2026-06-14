import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { Nav } from '@/components/nav';
import { currentUserQueryOptions } from '@/lib/auth/queries';
import { getServerToken } from '@/lib/auth/token.server';
import { getQueryClient } from '@/lib/get-query-client';

/**
 * Auth-aware nav as a dynamic island. Reads the cookie + prefetches the current
 * user (both dynamic), so it lives inside the layout's <Suspense>: the page
 * shell prerenders statically (PPR) while the nav streams in with the correct
 * logged-in/out state — no client-side flicker. The dehydrated user hydrates
 * into the shared QueryClient, so the rest of the app reads it too.
 */
export async function NavIsland() {
  const token = await getServerToken();
  const queryClient = getQueryClient();
  if (token) {
    await queryClient.prefetchQuery(currentUserQueryOptions(token));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Nav />
    </HydrationBoundary>
  );
}
