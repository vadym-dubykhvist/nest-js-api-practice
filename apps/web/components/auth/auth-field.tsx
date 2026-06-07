import type { ReactNode } from 'react';

/**
 * Labelled input row with an icon slot and inline error, matching the
 * framework's `inrow` field. Pass the icon + <input> as children.
 */
export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.78rem] font-semibold">{label}</label>
      <div
        className={`flex items-center gap-2.5 rounded-xl border bg-surface px-3.5 transition focus-within:ring-2 focus-within:ring-ring/30 ${
          error ? 'border-destructive' : 'border-border-strong focus-within:border-primary'
        }`}
      >
        {children}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
