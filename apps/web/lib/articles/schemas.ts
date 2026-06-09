import { z } from 'zod';

/**
 * Create-article form schema. Mirrors the backend CreateArticleDto (title,
 * description, body required); the linked event id comes from the route, not
 * the form.
 */
export const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  body: z.string().min(1, 'Body is required'),
  tagList: z.string().optional(),
});

export type CreateArticleValues = z.infer<typeof createArticleSchema>;

// The update DTO requires title/description/body and doesn't accept tags.
export const editArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  body: z.string().min(1, 'Body is required'),
});

export type EditArticleValues = z.infer<typeof editArticleSchema>;
