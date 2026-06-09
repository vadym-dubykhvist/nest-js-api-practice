'use client';

import { useState } from 'react';

import type { EventsQuery } from '@events/shared-types';

import {
  ArticleCard,
  articlesGridClassName,
} from '@/components/articles/article-card';
import { EventCard, eventsGridClassName } from '@/components/events/event-card';
import { useAuthorArticlesSuspense } from '@/lib/articles/hooks';
import { useEventsSuspense } from '@/lib/events/hooks';
import { useNow } from '@/lib/use-now';

type Tab = 'articles' | 'hosting' | 'going';

export function ProfileContent({
  username,
  serverNow,
}: {
  username: string;
  serverNow: number;
}) {
  const [tab, setTab] = useState<Tab>('articles');

  return (
    <>
      <div className="mt-7 mb-[22px] flex gap-1 border-b border-border">
        <TabButton active={tab === 'articles'} onClick={() => setTab('articles')}>
          Articles
        </TabButton>
        <TabButton active={tab === 'hosting'} onClick={() => setTab('hosting')}>
          Hosting
        </TabButton>
        <TabButton active={tab === 'going'} onClick={() => setTab('going')}>
          Going
        </TabButton>
      </div>

      {tab === 'articles' && <ArticlesGrid username={username} />}
      {tab === 'hosting' && (
        <EventsGrid
          query={{ author: username }}
          emptyLabel="Not hosting anything yet."
          serverNow={serverNow}
        />
      )}
      {tab === 'going' && (
        <EventsGrid
          query={{ attending: username }}
          emptyLabel="Not going to anything yet."
          serverNow={serverNow}
        />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3.5 py-3 text-[0.92rem] font-semibold transition ${
        active
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function ArticlesGrid({ username }: { username: string }) {
  const { data } = useAuthorArticlesSuspense(username);

  if (data.articles.length === 0) {
    return <Empty>No articles yet.</Empty>;
  }

  return (
    <div className={articlesGridClassName}>
      {data.articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

function EventsGrid({
  query,
  emptyLabel,
  serverNow,
}: {
  query: EventsQuery;
  emptyLabel: string;
  serverNow: number;
}) {
  const { data } = useEventsSuspense(query);
  const now = useNow(serverNow);

  if (data.events.length === 0) {
    return <Empty>{emptyLabel}</Empty>;
  }

  return (
    <div className={eventsGridClassName}>
      {data.events.map((event) => (
        <EventCard key={event.id} event={event} now={now} />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-16 text-center font-mono text-[0.85rem] text-muted-foreground">
      {children}
    </p>
  );
}
