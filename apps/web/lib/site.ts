/** Public origin of the web app. Set NEXT_PUBLIC_SITE_URL in production so
 * canonical/OG URLs, the sitemap and robots.txt point at the real domain. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4200';
