'use client';

import { useState } from 'react';

import { MapPin } from 'lucide-react';

import type { Event } from '@events/shared-types';

import { useCurrentUser } from '@/lib/auth/hooks';
import { capacityOf, timeFmt, weekdayFmt } from '@/lib/events/event-format';
import { useUnregisterEvent } from '@/lib/events/hooks';

import { RateWidget } from './rate-widget';
import { RegisterModal } from './register-modal';

export function EventTicket({ event }: { event: Event }) {
  const [regOpen, setRegOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const unregister = useUnregisterEvent(event.id);

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const cap = capacityOf(event);
  const isPast = end.getTime() < Date.now();

  return (
    <aside className="card sticky top-[100px] overflow-hidden rounded-[20px] border-border-strong">
      <div className="p-[22px_22px_18px]">
        <div className="eyebrow mb-2.5">Your spot</div>
        <div className="anton text-[2rem] leading-[0.95]">
          {weekdayFmt.format(start)}
          <small className="mt-1.5 block font-mono text-[0.82rem] normal-case text-muted-foreground">
            {timeFmt.format(start)} – {timeFmt.format(end)}
          </small>
        </div>

        {event.location && (
          <div className="my-[14px] flex items-center gap-2 text-[0.9rem] text-muted-foreground">
            <MapPin width={16} height={16} />
            {event.location}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[0.74rem] text-muted-foreground">
            <span>going</span>
            <span>{cap.label}</span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-full bg-elevated">
            <div className={`h-full ${cap.barColor}`} style={{ width: `${cap.pct}%` }} />
          </div>
        </div>
      </div>

      <div className="mx-[22px] border-t border-dashed border-border-strong" />

      <div className="p-[20px_22px_22px]">
        {event.registered ? (
          <>
            <div className="btn btn-outline btn-block pointer-events-none border-primary text-primary">
              Registered ✓
            </div>
            <button
              type="button"
              onClick={() => unregister.mutate()}
              disabled={unregister.isPending}
              className="btn btn-ghost btn-block mt-2.5 text-muted-foreground disabled:opacity-50"
            >
              {unregister.isPending ? 'Cancelling…' : 'Cancel registration'}
            </button>
          </>
        ) : isPast ? (
          <div className="btn btn-outline btn-block pointer-events-none opacity-40">
            Event ended
          </div>
        ) : cap.full ? (
          <div className="btn btn-outline btn-block pointer-events-none opacity-40">
            Sold out
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setRegOpen(true)}
              className="btn btn-acid btn-block btn-lg"
            >
              Register
            </button>
            <div className="note">FREE · guest or account</div>
          </>
        )}

        <RateWidget event={event} />
      </div>

      <RegisterModal
        event={event}
        isLoggedIn={!!user}
        open={regOpen}
        onClose={() => setRegOpen(false)}
      />
    </aside>
  );
}
