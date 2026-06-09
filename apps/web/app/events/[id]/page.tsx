import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EventDetailLoader } from '@/components/events/detail/event-detail-loader';
import { EventDetailSkeleton } from '@/components/events/detail/event-detail-skeleton';
import { getServerToken } from '@/lib/auth/token.server';
import { loadEvent } from '@/lib/events/load-event.server';

type Params = { params: Promise<{ id: string }> };

// Title only (deduped with the island via loadEvent's cache()). The 404 is
// owned by the island: a data-dependent 404 can't set a hard status anyway once
// the shell has streamed, so we don't duplicate it here — just fall back.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return {};

  try {
    const { event } = await loadEvent(id, await getServerToken());
    return { title: `${event.title} · Eventino` };
  } catch {
    return {};
  }
}

export default async function EventPage({ params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  // Static shell; the dynamic island (cookie + event fetch) streams into the
  // <Suspense> behind the skeleton, so the boundary is real and PPR-ready.
  return (
    <main>
      <section className="pt-[54px] pb-20">
        <div className="wrap">
          <div className="eyebrow mb-4">Event</div>
          <Suspense fallback={<EventDetailSkeleton />}>
            <EventDetailLoader id={id} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
