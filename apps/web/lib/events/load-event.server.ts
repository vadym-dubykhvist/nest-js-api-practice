import 'server-only';

import { cache } from 'react';

import { api } from '@events/api-client';

/**
 * Request-deduped event fetch shared by generateMetadata (for the title + a
 * pre-stream 404) and the page's dynamic island. `cache()` collapses both calls
 * — with identical (id, token) — into a single API request per render.
 */
export const loadEvent = cache((id: number, token: string | null) =>
  api.events.get(id, token ? { token } : undefined),
);
