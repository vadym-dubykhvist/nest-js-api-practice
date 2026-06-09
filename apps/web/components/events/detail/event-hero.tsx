import type { Event } from '@events/shared-types';

import { posterFor, weekdayFmt } from '@/lib/events/event-format';

export function EventHero({ event }: { event: Event }) {
  const start = new Date(event.startDate);

  return (
    <div
      className="relative flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-[22px] p-[34px] text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]"
      style={{ backgroundImage: posterFor(event.id) }}
    >
      <div className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-white/75">
        {weekdayFmt.format(start)}
        {event.location ? ` · ${event.location}` : ''}
      </div>
      <h1 className="anton max-w-[12ch] text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.9]">
        {event.title}
      </h1>
    </div>
  );
}
