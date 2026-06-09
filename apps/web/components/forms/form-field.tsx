import type { ReactNode } from 'react';
import Link from 'next/link';

export const formInputClass =
  'w-full rounded-[10px] border border-border-strong bg-card px-3.5 py-2.5 text-[0.92rem] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground';

export const formTextareaClass = `${formInputClass} resize-y`;

/** Labelled field with an optional hint and inline error. */
export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8rem] font-semibold">{label}</span>
      {children}
      {hint && !error ? (
        <span className="mt-1 block font-mono text-[0.7rem] text-muted-foreground">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

/** Form-level error banner (RHF `root` error). */
export function FormRootError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
      role="alert"
    >
      {message}
    </p>
  );
}

/** Shown in place of a create form when the visitor isn't signed in. */
export function SignInGate({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-muted-foreground">{label}</p>
      <Link href={href} className="btn btn-acid btn-lg">
        Sign in
      </Link>
    </div>
  );
}

/** "nestjs, workshop" → ["nestjs", "workshop"] (undefined when empty). */
export function splitTags(value?: string): string[] | undefined {
  if (!value) return undefined;
  const tags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
}
