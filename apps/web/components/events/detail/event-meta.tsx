import { Star } from 'lucide-react';

import type { Event } from '@events/shared-types';

import { Avatar } from '@/components/avatar';
import { statusOf } from '@/lib/events/event-format';

export function EventMeta({ event, now }: { event: Event; now: number }) {
  const status = statusOf(event, now);

  return (
    <>
      <div className="mt-6 mb-1.5 flex flex-wrap items-center gap-[14px]">
        <span className={`badge ${status.variant}`}>
          {status.live && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          )}
          {status.label}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[0.9rem] text-rating">
          <Star width={16} height={16} fill="currentColor" stroke="none" />
          <span className="font-mono text-[0.8rem] text-muted-foreground">
            {event.rating.toFixed(1)}
            {typeof event.ratingsCount === 'number'
              ? ` · ${event.ratingsCount} ratings`
              : ''}
          </span>
        </span>
      </div>

      <div className="my-5 flex items-center gap-3">
        <Avatar
          username={event.author.username}
          image={event.author.image}
          className="h-10 w-10 rounded-full bg-gradient-to-br from-live to-rating text-background"
          textClassName="text-sm"
        />
        <div>
          <div className="font-semibold">Hosted by {event.author.username}</div>
          <div className="font-mono text-[0.76rem] text-muted-foreground">
            @{event.author.username}
          </div>
        </div>
      </div>

      {event.tags.length > 0 && (
        <div className="my-4 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {event.description && (
        <p className="max-w-[60ch] text-[1.02rem] leading-[1.7] text-foreground/85">
          {event.description}
        </p>
      )}
    </>
  );
}
