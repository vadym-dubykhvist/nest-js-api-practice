import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { api, ApiError } from '@events/api-client';
import type { Event } from '@events/shared-types';

import { EventForm } from '@/components/events/event-form';
import { getServerToken } from '@/lib/auth/token.server';

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: 'Edit event · Eventino' };

export default async function EditEventPage({ params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const token = await getServerToken();
  if (!token) redirect(`/login?next=/events/${id}/edit`);

  let event: Event;
  let myUsername: string;
  try {
    const [eventRes, meRes] = await Promise.all([
      api.events.get(id, { token }),
      api.auth.me({ token }),
    ]);
    event = eventRes.event;
    myUsername = meRes.user.username;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) notFound();
      if (error.status === 401) redirect(`/login?next=/events/${id}/edit`);
    }
    throw error;
  }

  // Author only — anyone else is sent back to the event (the backend 403s too).
  if (event.author.username !== myUsername) redirect(`/events/${id}`);

  return (
    <main>
      <section className="pt-[54px] pb-24">
        <div className="wrap">
          <div className="eyebrow mb-2">Edit</div>
          <h1 className="anton mb-7 text-[clamp(2rem,5vw,3rem)]">Edit event</h1>
          <EventForm event={event} />
        </div>
      </section>
    </main>
  );
}
