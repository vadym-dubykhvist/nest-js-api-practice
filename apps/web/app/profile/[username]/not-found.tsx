import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

export default function ProfileNotFound() {
  return (
    <main>
      <section className="pt-[54px] pb-20">
        <div className="wrap">
          <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
            <div className="anton text-[clamp(5rem,16vw,11rem)] leading-[0.82] text-primary">
              404
            </div>
            <h2 className="anton mt-3 text-[clamp(1.8rem,5vw,2.6rem)]">
              No such profile
            </h2>
            <p className="mt-4 max-w-[42ch] text-[0.98rem] leading-[1.6] text-muted-foreground">
              This user doesn&apos;t exist or changed their handle.
            </p>
            <Link href="/events" className="btn btn-acid btn-lg mt-8">
              <ArrowLeft width={16} height={16} />
              Browse events
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
