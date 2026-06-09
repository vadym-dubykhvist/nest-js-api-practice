/**
 * Helpers for the "return here after auth" flow. Entry points (header, RSVP
 * modal, rate widget) link to `/login?next=<current>`; the auth pages read it
 * back and navigate there on success so the page they came from re-renders with
 * the new cookie (server components) and refetches personalised data (the
 * token-aware queries) — no manual reload needed.
 */

/** Append a `?next=` pointer so the auth page can return the user to `current`. */
export function withNext(base: string, current: string): string {
  if (!current || current === '/') return base;
  return `${base}?next=${encodeURIComponent(current)}`;
}

/**
 * Validate a `next` target read from the URL. Only same-origin absolute paths
 * are allowed — never a protocol-relative ("//evil.com") or external URL — so
 * this can't be turned into an open redirect.
 */
export function safeNext(raw: string | null | undefined, fallback = '/'): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return fallback;
}
