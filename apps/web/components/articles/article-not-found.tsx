import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

/** Branded "article missing" block, rendered inline by the loader (soft 404). */
export function ArticleNotFound() {
  return (
    <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
      <div className="anton text-[clamp(5rem,16vw,11rem)] leading-[0.82] text-primary">
        404
      </div>
      <h2 className="anton mt-3 text-[clamp(1.8rem,5vw,2.6rem)]">
        No such article
      </h2>
      <p className="mt-4 max-w-[42ch] text-[0.98rem] leading-[1.6] text-muted-foreground">
        It was removed or the link is wrong. Browse what&apos;s on instead.
      </p>
      <Link href="/events" className="btn btn-acid btn-lg mt-8">
        <ArrowLeft width={16} height={16} />
        Browse events
      </Link>
    </div>
  );
}
