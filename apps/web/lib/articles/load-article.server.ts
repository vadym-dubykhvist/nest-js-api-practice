import 'server-only';

import { cache } from 'react';

import { api } from '@events/api-client';

/**
 * Request-deduped article fetch shared by generateMetadata (title) and the
 * page's island. `cache()` collapses both calls — same (slug, token) — into a
 * single API request per render. Mirrors lib/events/load-event.server.ts.
 */
export const loadArticle = cache((slug: string, token: string | null) =>
  api.articles.get(slug, token ? { token } : undefined),
);
