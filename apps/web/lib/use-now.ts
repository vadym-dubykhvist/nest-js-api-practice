'use client';

import { useEffect, useState } from 'react';

/**
 * A clock for time-dependent UI (the status badges computed by `statusOf`).
 *
 * It's seeded with a timestamp taken on the server and threaded down as a prop,
 * so the server render and the first client render agree on "now" — that's what
 * avoids the hydration mismatch you'd get from calling `Date.now()` inline. After
 * mount it switches to the real client clock (correcting any server/client skew),
 * and with `intervalMs` it keeps ticking so a "Live" badge can light up while the
 * page is open.
 */
export function useNow(serverNow: number, intervalMs?: number): number {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    setNow(Date.now());
    if (!intervalMs) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
