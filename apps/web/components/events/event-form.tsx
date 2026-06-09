'use client';

import { useForm } from 'react-hook-form';
import { usePathname, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import type { CreateEventInput, Event } from '@events/shared-types';

import {
  FormField,
  formInputClass,
  FormRootError,
  formTextareaClass,
  SignInGate,
  splitTags,
} from '@/components/forms/form-field';
import { useCurrentUser } from '@/lib/auth/hooks';
import { withNext } from '@/lib/auth/redirect';
import { useCreateEvent, useUpdateEvent } from '@/lib/events/hooks';
import { createEventSchema, type CreateEventValues } from '@/lib/events/schemas';
import { applyApiErrors } from '@/lib/form';

// datetime-local carries no zone; store the typed wall-clock as UTC so it
// round-trips with the UTC-pinned display formatters (type 18:00 → see 18:00).
function toUtcIso(local: string): string {
  return `${local}:00.000Z`;
}

// "2026-09-15T18:00:00.000Z" → "2026-09-15T18:00" for <input type="datetime-local">.
function eventToValues(event: Event): CreateEventValues {
  return {
    title: event.title,
    description: event.description ?? '',
    location: event.location ?? '',
    image: event.image ?? '',
    startDate: event.startDate.slice(0, 16),
    endDate: event.endDate.slice(0, 16),
    maxGuests: event.maxGuests ? String(event.maxGuests) : '',
    tags: event.tags.join(', '),
  };
}

export function EventForm({ event }: { event?: Event }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(event?.id ?? 0);
  const isEdit = !!event;

  const form = useForm<CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: event
      ? eventToValues(event)
      : {
          title: '',
          description: '',
          location: '',
          image: '',
          startDate: '',
          endDate: '',
          maxGuests: '',
          tags: '',
        },
  });
  const { errors, isSubmitting } = form.formState;
  // Stay disabled through the post-success navigation so it can't double-submit.
  const busy = isSubmitting || createEvent.isSuccess || updateEvent.isSuccess;

  if (!user) {
    return (
      <SignInGate
        href={withNext('/login', pathname)}
        label="Sign in to create an event."
      />
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const input: CreateEventInput = {
      title: values.title,
      description: values.description || undefined,
      location: values.location || undefined,
      image: values.image || undefined,
      startDate: toUtcIso(values.startDate),
      endDate: toUtcIso(values.endDate),
      maxGuests: values.maxGuests ? Number(values.maxGuests) : undefined,
      tags: splitTags(values.tags),
    };
    try {
      const { event: saved } = isEdit
        ? await updateEvent.mutateAsync(input)
        : await createEvent.mutateAsync(input);
      router.push(`/events/${saved.id}`);
    } catch (error) {
      applyApiErrors(error, form.setError, [
        'title',
        'description',
        'location',
        'image',
        'startDate',
        'endDate',
        'maxGuests',
        'tags',
      ]);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-[640px] flex-col gap-4"
    >
      <FormRootError message={errors.root?.message} />

      <FormField label="Title" error={errors.title?.message}>
        <input
          {...form.register('title')}
          className={formInputClass}
          placeholder="NestJS Meetup"
        />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <textarea
          {...form.register('description')}
          rows={3}
          className={formTextareaClass}
          placeholder="What's it about?"
        />
      </FormField>

      <FormField label="Location" error={errors.location?.message}>
        <input
          {...form.register('location')}
          className={formInputClass}
          placeholder="Kyiv, UNIT.City"
        />
      </FormField>

      <FormField
        label="Cover image URL"
        error={errors.image?.message}
        hint="Optional — falls back to a generated cover"
      >
        <input
          {...form.register('image')}
          className={formInputClass}
          placeholder="https://…"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Starts" error={errors.startDate?.message} hint="UTC">
          <input
            type="datetime-local"
            {...form.register('startDate')}
            className={formInputClass}
          />
        </FormField>
        <FormField label="Ends" error={errors.endDate?.message} hint="UTC">
          <input
            type="datetime-local"
            {...form.register('endDate')}
            className={formInputClass}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Max guests"
          error={errors.maxGuests?.message}
          hint="0 or empty = unlimited"
        >
          <input
            type="number"
            min={0}
            {...form.register('maxGuests')}
            className={formInputClass}
            placeholder="100"
          />
        </FormField>
        <FormField
          label="Tags"
          error={errors.tags?.message}
          hint="comma-separated"
        >
          <input
            {...form.register('tags')}
            className={formInputClass}
            placeholder="nestjs, workshop"
          />
        </FormField>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn btn-acid btn-lg mt-2 self-start disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : isEdit ? (
          'Save changes'
        ) : (
          'Create event'
        )}
      </button>
    </form>
  );
}
