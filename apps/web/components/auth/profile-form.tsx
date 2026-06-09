'use client';

import { useForm } from 'react-hook-form';
import { usePathname, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import type { UpdateUserInput } from '@events/shared-types';

import {
  FormField,
  formInputClass,
  FormRootError,
  formTextareaClass,
  SignInGate,
} from '@/components/forms/form-field';
import { useCurrentUser, useUpdateUser } from '@/lib/auth/hooks';
import { withNext } from '@/lib/auth/redirect';
import { editProfileSchema, type EditProfileValues } from '@/lib/auth/schemas';
import { applyApiErrors } from '@/lib/form';

export function ProfileForm() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const update = useUpdateUser();

  const form = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    // `values` keeps the form in sync once the hydrated current user is read.
    values: {
      email: user?.email ?? '',
      bio: user?.bio ?? '',
      image: user?.image ?? '',
    },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || update.isSuccess;

  if (!user) {
    return (
      <SignInGate
        href={withNext('/login', pathname)}
        label="Sign in to edit your profile."
      />
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const input: UpdateUserInput = {
      email: values.email,
      bio: values.bio ?? '',
      image: values.image ?? '',
    };
    try {
      const updated = await update.mutateAsync(input);
      router.push(`/profile/${updated.username}`);
    } catch (error) {
      applyApiErrors(error, form.setError, ['email', 'bio', 'image']);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-[560px] flex-col gap-4"
    >
      <FormRootError message={errors.root?.message} />

      <FormField label="Email" error={errors.email?.message}>
        <input
          {...form.register('email')}
          type="email"
          className={formInputClass}
          placeholder="you@example.com"
        />
      </FormField>

      <FormField label="Bio" error={errors.bio?.message}>
        <textarea
          {...form.register('bio')}
          rows={3}
          className={formTextareaClass}
          placeholder="A line or two about you."
        />
      </FormField>

      <FormField
        label="Avatar image URL"
        error={errors.image?.message}
        hint="Leave empty to use your initials"
      >
        <input
          {...form.register('image')}
          className={formInputClass}
          placeholder="https://…"
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
          'Save profile'
        )}
      </button>
    </form>
  );
}
