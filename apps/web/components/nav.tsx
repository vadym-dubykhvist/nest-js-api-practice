'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ArrowUpRight, LogOut, Search } from 'lucide-react';

import { useCurrentUser, useLogout } from '@/lib/auth/hooks';
import { withNext } from '@/lib/auth/redirect';

/**
 * App header with auth state. Because the current-user query is prefetched on
 * the server and hydrated (see app/layout.tsx), this renders the correct
 * logged-in/out state on the FIRST paint — no Login→Avatar flicker.
 */
export function Nav() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[66px] max-w-[1180px] items-center gap-4 px-7">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-2xl uppercase tracking-[0.02em]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand svg */}
          <img
            src="/logo.svg"
            alt=""
            className="h-[26px] w-[22px] [filter:drop-shadow(0_0_10px_rgba(205,255,58,0.55))]"
          />
          Eventino
        </Link>

        <label className="ml-2 hidden max-w-[330px] flex-1 items-center gap-2 rounded-xl border border-border-strong bg-card px-3.5 py-2.5 text-muted-foreground sm:flex">
          <Search className="h-[18px] w-[18px]" />
          <input
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search the night…"
          />
        </label>

        <div className="flex-1" />

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center gap-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-elevated text-xs font-bold uppercase">
                {user.username.slice(0, 2)}
              </span>
              <span className="hidden text-sm font-semibold sm:inline">
                {user.username}
              </span>
            </Link>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              className="inline-flex items-center rounded-xl border border-border-strong p-2.5 transition hover:border-foreground"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href={withNext('/login', pathname)}
              className="rounded-xl border border-border-strong px-4 py-2.5 text-sm font-semibold transition hover:border-foreground"
            >
              Log in
            </Link>
            <Link
              href={withNext('/register', pathname)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:shadow-[0_0_0_1px_rgba(205,255,58,0.25),0_10px_40px_-8px_rgba(205,255,58,0.35)]"
            >
              Create account <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
