import { EventNotFound } from '@/components/events/detail/event-not-found';

// Rendered for the HARD 404 (malformed id → notFound() in the page, pre-stream).
// The soft 404 (missing event during streaming) renders <EventNotFound /> inline
// from the loader instead, to avoid Next's default not-found doubling up.
export default function EventNotFoundPage() {
  return (
    <main>
      <section className="pt-[54px] pb-20">
        <div className="wrap">
          <div className="eyebrow mb-4">Event · 404</div>
          <EventNotFound />
        </div>
      </section>
    </main>
  );
}
