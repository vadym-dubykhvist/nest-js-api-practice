import { cookies } from 'next/headers';

import { TOKEN_COOKIE } from '@/lib/auth/token';

/**
 * Read the auth token on the server (Server Components, route handlers) so the
 * first render can be personalized. In Next 15 `cookies()` is async.
 */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}
