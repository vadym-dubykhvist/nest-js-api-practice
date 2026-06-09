'use client';

import { useState } from 'react';

import { useCreateComment } from '@/lib/comments/hooks';

export function CommentForm({
  slug,
  parentId,
  placeholder = 'Add a comment…',
  submitLabel = 'Post',
  autoFocus = false,
  onDone,
}: {
  slug: string;
  parentId?: number;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [body, setBody] = useState('');
  const create = useCreateComment(slug);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    create.mutate(
      { body: text, parentId },
      {
        onSuccess: () => {
          setBody('');
          onDone?.();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        className="w-full resize-y rounded-[12px] border border-border-strong bg-card px-3.5 py-3 text-[0.92rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
      />
      {create.isError && (
        <p className="font-mono text-[0.74rem] text-destructive">
          Could not post. Please try again.
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="btn btn-ghost text-muted-foreground"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={create.isPending || !body.trim()}
          className="btn btn-acid disabled:opacity-50"
        >
          {create.isPending ? 'Posting…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
