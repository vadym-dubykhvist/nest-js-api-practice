/**
 * JWT storage in a cookie that BOTH the server (SSR personalization) and the
 * browser (attaching `Authorization: Token <jwt>` via the api-client) can read.
 *
 * Trade-off (per plan R5): this cookie is NOT httpOnly, so client JS can read
 * the token. Simpler, enables SSR + client reads with one source. If you need
 * stronger XSS protection later, switch to an httpOnly cookie set by a Route
 * Handler / Server Action and have the proxy inject the Authorization header.
 *
 * These helpers are browser-only (they touch document.cookie). On the server,
 * read the cookie with lib/auth/token.server.ts instead.
 */
export const TOKEN_COOKIE = 'events_token';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string): void {
  if (typeof document === 'undefined') return;
  // Add `; Secure` in production (HTTPS). Omitted so it works on http://localhost.
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearToken(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
