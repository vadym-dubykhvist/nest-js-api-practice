import 'server-only';

import { cache } from 'react';

import { api } from '@events/api-client';

/**
 * Request-deduped profile fetch shared by generateMetadata and the page, so a
 * profile render hits the API once. Mirrors lib/events/load-event.server.ts.
 */
export const loadProfile = cache((username: string, token: string | null) =>
  api.profiles.get(username, token ? { token } : undefined),
);
