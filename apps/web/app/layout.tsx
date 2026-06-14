import '@/app/globals.css';

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Anton, Inter, Space_Mono } from 'next/font/google';

import { Providers } from '@/app/providers';
import { NavIsland } from '@/components/nav-island';
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

// Static shell (no dynamic APIs here, so it prerenders). The auth-dependent nav
// reads the cookie inside <NavIsland>, behind <Suspense> — that's the dynamic
// hole PPR streams; pages provide their own static shell + islands below.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} ${spaceMono.variable}`}
    >
      <body>
        <Providers>
          <Suspense
            fallback={
              <header className="sticky top-0 z-40 h-[66px] border-b border-border bg-background/80 backdrop-blur-md" />
            }
          >
            <NavIsland />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
