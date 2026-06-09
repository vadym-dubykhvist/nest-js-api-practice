'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import type { CreateArticleInput } from '@events/shared-types';

import {
  FormField,
  formInputClass,
  FormRootError,
  formTextareaClass,
  SignInGate,
  splitTags,
} from '@/components/forms/form-field';
import { useCreateArticle } from '@/lib/articles/hooks';
import {
  createArticleSchema,
  type CreateArticleValues,
} from '@/lib/articles/schemas';
import { useCurrentUser } from '@/lib/auth/hooks';
import { withNext } from '@/lib/auth/redirect';
import { applyApiErrors } from '@/lib/form';

export function ArticleForm({
  eventId,
  authorUsername,
  registered,
}: {
  eventId: number;
  authorUsername: string;
  registered: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const createArticle = useCreateArticle();

  const form = useForm<CreateArticleValues>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: { title: '', description: '', body: '', tagList: '' },
  });
  const { errors, isSubmitting } = form.formState;

  if (!user) {
    return (
      <SignInGate
        href={withNext('/login', pathname)}
        label="Sign in to write an article."
      />
    );
  }

  // Mirrors the backend rule: only the host or a registered attendee may write.
  const canWrite = registered || user.username === authorUsername;
  if (!canWrite) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="max-w-[44ch] text-muted-foreground">
          Only the host or a registered attendee can write about this event.
        </p>
        <Link href={`/events/${eventId}`} className="btn btn-acid btn-lg">
          Register for the event
        </Link>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const input: CreateArticleInput = {
      title: values.title,
      description: values.description,
      body: values.body,
      tagList: splitTags(values.tagList),
      eventId,
    };
    try {
      const { article } = await createArticle.mutateAsync(input);
      router.push(`/articles/${article.slug}`);
    } catch (error) {
      applyApiErrors(error, form.setError, [
        'title',
        'description',
        'body',
        'tagList',
      ]);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-[720px] flex-col gap-4"
    >
      <FormRootError message={errors.root?.message} />

      <FormField label="Title" error={errors.title?.message}>
        <input
          {...form.register('title')}
          className={formInputClass}
          placeholder="How we deployed to k8s"
        />
      </FormField>

      <FormField label="Summary" error={errors.description?.message}>
        <textarea
          {...form.register('description')}
          rows={2}
          className={formTextareaClass}
          placeholder="One or two sentences."
        />
      </FormField>

      <FormField label="Body" error={errors.body?.message}>
        <textarea
          {...form.register('body')}
          rows={12}
          className={formTextareaClass}
          placeholder="Write your article…"
        />
      </FormField>

      <FormField
        label="Tags"
        error={errors.tagList?.message}
        hint="comma-separated"
      >
        <input
          {...form.register('tagList')}
          className={formInputClass}
          placeholder="nestjs, api"
        />
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting || createArticle.isSuccess}
        className="btn btn-acid btn-lg mt-2 self-start disabled:opacity-60"
      >
        {isSubmitting || createArticle.isSuccess ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : (
          'Publish article'
        )}
      </button>
    </form>
  );
}
