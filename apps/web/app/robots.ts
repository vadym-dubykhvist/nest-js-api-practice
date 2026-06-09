import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site';

// Crawl the public content; keep auth, create/edit and the API proxy out of
// the index (they're per-user or non-content).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/login',
        '/register',
        '/settings',
        '/events/new',
        '/events/*/edit',
        '/events/*/articles/new',
        '/articles/*/edit',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
