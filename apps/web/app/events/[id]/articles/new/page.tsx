import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { api, ApiError } from '@events/api-client';
import type { Event } from '@events/shared-types';

import { ArticleForm } from '@/components/articles/article-form';
import { getServerToken } from '@/lib/auth/token.server';

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: 'New article · Eventino' };

export default async function NewArticlePage({ params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  // Fetch with the cookie token so the event carries `registered` (and author)
  // — the form uses them to hide itself from non-host, non-attendee viewers
  // (and to 404 before showing a doomed form).
  const token = await getServerToken();
  let event: Event;
  try {
    ({ event } = await api.events.get(id, token ? { token } : undefined));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main>
      <section className="pt-[54px] pb-24">
        <div className="wrap">
          <Link
            href={`/events/${id}`}
            className="mb-2 inline-block font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-primary hover:underline"
          >
            ↳ {event.title}
          </Link>
          <h1 className="anton mb-7 text-[clamp(2rem,5vw,3rem)]">
            Write an article
          </h1>
          <ArticleForm
            eventId={id}
            authorUsername={event.author.username}
            registered={!!event.registered}
          />
        </div>
      </section>
    </main>
  );
}
