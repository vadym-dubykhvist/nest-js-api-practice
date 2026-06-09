import type { Metadata } from 'next';

import { EventForm } from '@/components/events/event-form';

export const metadata: Metadata = { title: 'New event · Eventino' };

export default function NewEventPage() {
  return (
    <main>
      <section className="pt-[54px] pb-24">
        <div className="wrap">
          <div className="eyebrow mb-2">New</div>
          <h1 className="anton mb-7 text-[clamp(2rem,5vw,3rem)]">Create event</h1>
          <EventForm />
        </div>
      </section>
    </main>
  );
}
