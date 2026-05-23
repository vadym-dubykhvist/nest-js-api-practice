import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { authHeader } from './auth';

export interface CreatedArticle {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  favoritesCount: number;
  author: {
    id: number;
    username: string;
    email: string;
    bio: string;
    image: string;
  };
}

export async function createArticle(
  app: INestApplication,
  token: string,
  overrides: Partial<{
    title: string;
    description: string;
    body: string;
    tagList: string[];
    eventId: number;
  }> = {},
): Promise<CreatedArticle> {
  const dto = {
    title: overrides.title ?? 'How to build a NestJS API',
    description: overrides.description ?? 'A short summary.',
    body: overrides.body ?? 'The full article body.',
    tagList: overrides.tagList,
    eventId: overrides.eventId,
  };

  const response = await request(app.getHttpServer())
    .post('/api/articles')
    .set(authHeader(token))
    .send({ article: dto })
    .expect(201);

  return response.body.article as CreatedArticle;
}
