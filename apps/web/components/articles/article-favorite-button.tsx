'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Heart } from 'lucide-react';

import type { Article } from '@events/shared-types';

import { useFavoriteArticle } from '@/lib/articles/hooks';
import { useCurrentUser } from '@/lib/auth/hooks';
import { withNext } from '@/lib/auth/redirect';

export function ArticleFavoriteButton({ article }: { article: Article }) {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const favorite = useFavoriteArticle(article.slug);

  // Logged out: send them to login, then back to favorite.
  if (!user) {
    return (
      <Link href={withNext('/login', pathname)} className="btn btn-outline">
        <Heart width={16} height={16} />
        {article.favoritesCount}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => favorite.mutate(!!article.favorited)}
      disabled={favorite.isPending}
      className={`btn ${article.favorited ? 'btn-acid' : 'btn-outline'} disabled:opacity-50`}
    >
      <Heart
        width={16}
        height={16}
        fill={article.favorited ? 'currentColor' : 'none'}
      />
      {article.favoritesCount}
    </button>
  );
}
