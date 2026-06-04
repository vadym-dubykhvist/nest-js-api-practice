import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { authHeader } from './auth';

export interface CreatedComment {
  id: number;
  body: string;
  likesCount: number;
  liked: boolean;
  author: { username: string; bio: string; image: string };
  replies: CreatedComment[];
}

export async function createComment(
  app: INestApplication,
  token: string,
  slug: string,
  overrides: Partial<{ body: string; parentId: number }> = {},
): Promise<CreatedComment> {
  const response = await request(app.getHttpServer())
    .post(`/api/articles/${slug}/comments`)
    .set(authHeader(token))
    .send({
      comment: {
        body: overrides.body ?? 'A comment',
        parentId: overrides.parentId,
      },
    })
    .expect(201);

  return response.body.comment as CreatedComment;
}
