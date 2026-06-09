import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

/**
 * Branded "event missing" block. Rendered two ways:
 *  - inline by the loader for a soft 404 (valid id, no such event — status 200,
 *    because the shell already streamed);
 *  - inside app/events/[id]/not-found.tsx for the hard 404 (malformed id).
 * No <main>/<section> here — the surrounding shell provides them.
 */
export function EventNotFound() {
  return (
    <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
      <div className="anton text-[clamp(5rem,16vw,11rem)] leading-[0.82] text-primary">
        404
      </div>

      <h2 className="anton mt-3 text-[clamp(1.8rem,5vw,2.6rem)] uppercase">
        This event
        <br />
        doesn&apos;t exist
      </h2>

      <p className="mt-4 max-w-[42ch] text-[0.98rem] leading-[1.6] text-muted-foreground">
        It was removed, expired, or never existed. Double-check the link — or see
        what&apos;s on right now.
      </p>

      <Link href="/events" className="btn btn-acid btn-lg mt-8">
        <ArrowLeft width={16} height={16} />
        Browse events
      </Link>
    </div>
  );
}
