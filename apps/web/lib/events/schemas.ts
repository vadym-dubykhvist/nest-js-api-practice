import { z } from 'zod';

/**
 * Create-event form schema. Kept in sync with the backend CreateEventDto; the
 * server stays the source of truth (422s map onto fields via lib/form.ts).
 * Dates are raw <input type="datetime-local"> strings ("YYYY-MM-DDTHH:MM"),
 * converted to UTC ISO on submit.
 */
export const createEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    location: z.string().optional(),
    image: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    maxGuests: z.string().optional(),
    tags: z.string().optional(),
  })
  .refine((d) => !(d.startDate && d.endDate) || d.endDate > d.startDate, {
    message: 'End must be after start',
    path: ['endDate'],
  });

export type CreateEventValues = z.infer<typeof createEventSchema>;
