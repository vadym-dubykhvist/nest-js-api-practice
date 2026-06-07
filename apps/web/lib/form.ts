import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@events/api-client';

/**
 * Map an API error onto a react-hook-form. The server is the source of truth
 * for validation: 422 field messages land on their inputs, anything unknown
 * (or a non-API failure) lands on the form-level `root` error.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: Path<T>[],
): void {
  const root = 'root' as Path<T>;

  if (!(error instanceof ApiError)) {
    setError(root, { message: 'Network error. Please try again.' });
    return;
  }
  if (!error.errors) {
    setError(root, { message: error.message });
    return;
  }

  const known = new Set<string>(knownFields as unknown as string[]);
  const rootMessages: string[] = [];

  for (const [field, messages] of Object.entries(error.errors)) {
    const message = messages.join(', ');
    if (known.has(field)) {
      setError(field as Path<T>, { message });
    } else {
      rootMessages.push(`${field}: ${message}`);
    }
  }

  if (rootMessages.length > 0) {
    setError(root, { message: rootMessages.join('; ') });
  }
}
