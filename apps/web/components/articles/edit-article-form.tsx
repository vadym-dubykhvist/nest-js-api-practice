'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import type { Article, UpdateArticleInput } from '@events/shared-types';

import {
  FormField,
  formInputClass,
  FormRootError,
  formTextareaClass,
} from '@/components/forms/form-field';
import { useUpdateArticle } from '@/lib/articles/hooks';
import {
  editArticleSchema,
  type EditArticleValues,
} from '@/lib/articles/schemas';
import { applyApiErrors } from '@/lib/form';

// Tags aren't editable via the update endpoint, so they're omitted here.
export function EditArticleForm({ article }: { article: Article }) {
  const router = useRouter();
  const update = useUpdateArticle(article.slug);

  const form = useForm<EditArticleValues>({
    resolver: zodResolver(editArticleSchema),
    defaultValues: {
      title: article.title,
      description: article.description,
      body: article.body,
    },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || update.isSuccess;

  const onSubmit = form.handleSubmit(async (values) => {
    const input: UpdateArticleInput = {
      title: values.title,
      description: values.description,
      body: values.body,
    };
    try {
      const { article: saved } = await update.mutateAsync(input);
      router.push(`/articles/${saved.slug}`);
    } catch (error) {
      applyApiErrors(error, form.setError, ['title', 'description', 'body']);
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
        <input {...form.register('title')} className={formInputClass} />
      </FormField>

      <FormField label="Summary" error={errors.description?.message}>
        <textarea
          {...form.register('description')}
          rows={2}
          className={formTextareaClass}
        />
      </FormField>

      <FormField label="Body" error={errors.body?.message}>
        <textarea
          {...form.register('body')}
          rows={12}
          className={formTextareaClass}
        />
      </FormField>

      <button
        type="submit"
        disabled={busy}
        className="btn btn-acid btn-lg mt-2 self-start disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : (
          'Save changes'
        )}
      </button>
    </form>
  );
}
