'use client';

import { useState } from 'react';
import Link from 'next/link';

import { X } from 'lucide-react';

import type { Event, RegisterEventInput } from '@events/shared-types';

import { capacityOf, timeFmt, weekdayFmt } from '@/lib/events/event-format';
import { useRegisterEvent } from '@/lib/events/hooks';

const inputClass =
  'w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-3 text-[0.92rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground';

export function RegisterModal({
  event,
  isLoggedIn,
  open,
  onClose,
}: {
  event: Event;
  isLoggedIn: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const register = useRegisterEvent(event.id);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  if (!open) return null;

  const start = new Date(event.startDate);
  const cap = capacityOf(event);
  const spotsLeft = event.maxGuests > 0 ? event.maxGuests - event.registeredCount : null;
  const guestIncomplete = !isLoggedIn && (!name.trim() || !email.trim());

  const submit = () => {
    const input: RegisterEventInput = isLoggedIn
      ? { additionalInfo: note || undefined }
      : { name, email, additionalInfo: note || undefined };
    register.mutate(input, { onSuccess: onClose });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card relative w-full max-w-[440px] rounded-[20px] border-border-strong p-[26px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <X width={20} height={20} />
        </button>

        <div className="eyebrow mb-1.5">RSVP</div>
        <h3 className="anton text-[1.8rem]">{event.title}</h3>
        <div className="mt-1.5 font-mono text-[0.78rem] text-muted-foreground">
          {weekdayFmt.format(start)} · {timeFmt.format(start)}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {!isLoggedIn && (
            <>
              <Field label="Name">
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
            </>
          )}
          <Field label="Note · optional">
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Dietary, accessibility…"
            />
          </Field>
        </div>

        {register.isError && (
          <div className="mt-3 font-mono text-[0.76rem] text-destructive">
            Could not register. Please check the form and try again.
          </div>
        )}

        <div className="my-4 font-mono text-[0.72rem] text-muted-foreground">
          {spotsLeft !== null
            ? `${spotsLeft} of ${event.maxGuests} spots left`
            : `${cap.label} going`}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={register.isPending || guestIncomplete}
          className="btn btn-acid btn-block btn-lg disabled:opacity-50"
        >
          {register.isPending ? 'Confirming…' : 'Confirm RSVP'}
        </button>

        {!isLoggedIn && (
          <div className="mt-3 text-center font-mono text-[0.74rem] text-muted-foreground">
            Have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.78rem] font-semibold">{label}</span>
      {children}
    </label>
  );
}
