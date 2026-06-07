import { z } from 'zod';

/**
 * Form validation schemas. Keep these in sync with the backend DTO validators
 * (class-validator) so client and server agree; the server stays the source of
 * truth and surfaces 422s mapped onto fields via lib/form.ts.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3, 'At least 3 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type RegisterValues = z.infer<typeof registerSchema>;
