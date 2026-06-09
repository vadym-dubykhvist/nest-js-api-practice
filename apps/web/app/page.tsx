import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { api } from '@events/api-client';
import type { Event } from '@events/shared-types';

// Fetched per request (the API is dynamic) — no prerender at build time.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let events: Event[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const res = await api.events.list({ limit: 20 });
    events = res.events;
    total = res.eventsCount;
  } catch {
    error = 'API unavailable';
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="mt-1 text-sm opacity-60">
          apps/web scaffold ready — start building the frontend in{' '}
          <code className="rounded bg-black/5 px-1 py-0.5">apps/web/app</code>.
        </p>
        <Link href="/events" className="btn btn-acid btn-lg mt-5 inline-flex">
          See events
          <ArrowRight width={16} height={16} />
        </Link>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-300/60 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : events.length === 0 ? (
        <p className="opacity-60">No events yet.</p>
      ) : (
        <>
          <p className="mb-4 text-sm opacity-60">{total} event(s)</p>
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-black/10 p-4 transition hover:border-black/30"
              >
                <div className="font-semibold">{event.title}</div>
                <div className="mt-1 text-sm opacity-60">
                  {event.location || '—'} · {event.registeredCount}
                  {event.maxGuests ? `/${event.maxGuests}` : ''} registered
                  {event.rating ? ` · ★ ${event.rating.toFixed(1)}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
