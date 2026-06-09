'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Star } from 'lucide-react';

import type { Event } from '@events/shared-types';

import { useCurrentUser } from '@/lib/auth/hooks';
import { useRateEvent } from '@/lib/events/hooks';

export function RateWidget({ event }: { event: Event }) {
  const { data: user } = useCurrentUser();
  const rate = useRateEvent(event.id);
  const [hover, setHover] = useState(0);

  const current = event.myRating ?? 0;
  const hasRated = event.myRating != null;

  if (!user) {
    return (
      <Link href="/login" className="btn btn-outline btn-block mt-3">
        Sign in to rate
      </Link>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-1.5 font-mono text-[0.72rem] text-muted-foreground">
        {hasRated ? 'Your rating' : 'Rate this event'}
      </div>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || current) >= n;
          return (
            <button
              key={n}
              type="button"
              disabled={rate.isPending}
              aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => rate.mutate({ score: n, hasRated })}
              className="cursor-pointer p-0.5 text-rating disabled:opacity-50"
            >
              <Star
                width={22}
                height={22}
                fill={active ? 'currentColor' : 'none'}
                className={active ? '' : 'text-muted-foreground'}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
