import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { api, ApiError } from '@events/api-client';
import type { Article } from '@events/shared-types';

import { EditArticleForm } from '@/components/articles/edit-article-form';
import { getServerToken } from '@/lib/auth/token.server';

type Params = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: 'Edit article',
  robots: { index: false },
};

export default async function EditArticlePage({ params }: Params) {
  const { slug } = await params;

  const token = await getServerToken();
  if (!token) redirect(`/login?next=/articles/${slug}/edit`);

  let article: Article;
  let myUsername: string;
  try {
    const [articleRes, meRes] = await Promise.all([
      api.articles.get(slug, { token }),
      api.auth.me({ token }),
    ]);
    article = articleRes.article;
    myUsername = meRes.user.username;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) notFound();
      if (error.status === 401) redirect(`/login?next=/articles/${slug}/edit`);
    }
    throw error;
  }

  // Author only — anyone else is sent back to the article (the backend 403s too).
  if (article.author.username !== myUsername) redirect(`/articles/${slug}`);

  return (
    <main>
      <section className="pt-[54px] pb-24">
        <div className="wrap">
          <div className="eyebrow mb-2">Edit</div>
          <h1 className="anton mb-7 text-[clamp(2rem,5vw,3rem)]">
            Edit article
          </h1>
          <EditArticleForm article={article} />
        </div>
      </section>
    </main>
  );
}
