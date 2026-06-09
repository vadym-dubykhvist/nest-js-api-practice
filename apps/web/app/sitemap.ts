import type { MetadataRoute } from 'next';

import { api } from '@events/api-client';

import { siteUrl } from '@/lib/site';

// Static routes + every event and article (profiles have no list endpoint, so
// they're omitted). Degrades to just the static routes if the API is down.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, articles] = await Promise.all([
    api.events
      .list({ limit: 1000 })
      .then((r) => r.events)
      .catch(() => []),
    api.articles
      .list({ limit: 1000 })
      .then((r) => r.articles)
      .catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = ['', '/events', '/articles'].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: 'daily',
      priority: path === '' ? 1 : 0.8,
    }),
  );

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteUrl}/events/${event.id}`,
    lastModified: new Date(event.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...eventRoutes, ...articleRoutes];
}
