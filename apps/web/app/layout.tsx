import '@/app/globals.css';

import type { Metadata } from 'next';
import { Anton, Inter, Space_Mono } from 'next/font/google';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { Providers } from '@/app/providers';
import { Nav } from '@/components/nav';
import { currentUserQueryOptions } from '@/lib/auth/queries';
import { getServerToken } from '@/lib/auth/token.server';
import { getQueryClient } from '@/lib/get-query-client';
import { siteUrl } from '@/lib/site';

// next/font self-hosts the fonts and exposes them as CSS variables that
// globals.css aliases to --font-display / --font-sans / --font-mono.
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Pages set only their own title; the template appends the brand.
  title: { default: 'Eventino', template: '%s · Eventino' },
  description: 'Events platform — register, discuss, rate.',
  openGraph: {
    siteName: 'Eventino',
    type: 'website',
    title: 'Eventino',
    description: 'Events platform — register, discuss, rate.',
  },
  twitter: { card: 'summary_large_image' },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Personalize the first paint: read the token on the server and prefetch the
  // current user, then dehydrate so the client cache starts already-filled.
  const token = await getServerToken();
  const queryClient = getQueryClient();
  if (token) {
    await queryClient.prefetchQuery(currentUserQueryOptions(token));
  }

  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} ${spaceMono.variable}`}
    >
      <body>
        <Providers>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <Nav />
            {children}
          </HydrationBoundary>
        </Providers>
      </body>
    </html>
  );
}
