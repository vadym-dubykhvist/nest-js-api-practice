import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

// Static landing — no data, just the brand and a way into the app.
export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100dvh_-_66px)] flex-col items-center justify-center gap-12 px-6 text-center">
      <div className="flex flex-col items-center gap-5">
        {/* logo + wordmark */}
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand svg */}
          <img
            src="/logo.svg"
            alt=""
            className="h-[44px] w-[37px] [filter:drop-shadow(0_0_18px_rgba(205,255,58,0.6))]"
          />
          <span className="anton text-[clamp(2.6rem,8vw,4.6rem)]">Eventino</span>
        </div>

        <p className="max-w-[44ch] text-[clamp(1rem,2.4vw,1.22rem)] leading-[1.6] text-muted-foreground">
          Ready to dive into the world of events?
        </p>
      </div>

      {/* big CTA */}
      <Link
        href="/events"
        className="group inline-flex items-center gap-4 rounded-[36px] bg-primary px-12 py-7 text-primary-foreground transition duration-200 hover:scale-[1.03] hover:shadow-[0_0_0_1px_rgba(205,255,58,0.35),0_24px_90px_-16px_rgba(205,255,58,0.55)]"
      >
        <span className="font-display text-[clamp(1.7rem,4vw,2.4rem)] leading-none">
          See events
        </span>
        <ArrowRight
          className="h-8 w-8 transition-transform duration-200 group-hover:translate-x-1.5"
          strokeWidth={2.5}
        />
      </Link>
    </main>
  );
}
