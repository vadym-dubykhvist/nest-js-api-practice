import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp } from './helpers/test-app';
import { cleanDatabase } from './helpers/db';
import { authHeader, registerUser } from './helpers/auth';
import { createArticle } from './helpers/articles';
import { createComment } from './helpers/comments';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    http = request(app.getHttpServer());
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('creates a top-level comment', async () => {
      const author = await registerUser(app, { username: 'author' });
      const commenter = await registerUser(app, { username: 'commenter' });
      const article = await createArticle(app, author.token);

      const response = await http
        .post(`/api/articles/${article.slug}/comments`)
        .set(authHeader(commenter.token))
        .send({ comment: { body: 'Great article!' } })
        .expect(201);

      expect(response.body.comment).toMatchObject({
        id: expect.any(Number),
        body: 'Great article!',
        likesCount: 0,
        liked: false,
        author: {
          username: commenter.username,
          bio: commenter.bio,
          image: commenter.image,
        },
        replies: [],
      });
    });

    it('persists the comment in the database', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const comment = await createComment(app, author.token, article.slug, {
        body: 'A persisted comment',
      });

      const rows = await dataSource.query<{ body: string }[]>(
        `SELECT body FROM comments WHERE id = $1`,
        [comment.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].body).toBe('A persisted comment');
    });

    it('creates a reply linked to the parent comment', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const parent = await createComment(app, author.token, article.slug, {
        body: 'parent',
      });
      const reply = await createComment(app, author.token, article.slug, {
        body: 'reply',
        parentId: parent.id,
      });

      const rows = await dataSource.query<{ parentId: number }[]>(
        `SELECT "parentId" FROM comments WHERE id = $1`,
        [reply.id],
      );
      expect(rows[0].parentId).toBe(parent.id);
    });

    it('returns 404 when the parent comment does not exist', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const response = await http
        .post(`/api/articles/${article.slug}/comments`)
        .set(authHeader(author.token))
        .send({ comment: { body: 'orphan', parentId: 999999 } })
        .expect(404);

      expect(response.body.errors).toEqual({ 'parent comment': ['not found'] });
    });

    it('returns 404 when the article does not exist', async () => {
      const user = await registerUser(app);

      await http
        .post('/api/articles/missing/comments')
        .set(authHeader(user.token))
        .send({ comment: { body: 'orphan' } })
        .expect(404);
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      await http
        .post(`/api/articles/${article.slug}/comments`)
        .send({ comment: { body: 'anon' } })
        .expect(401);
    });

    it('returns 422 when the body is missing', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const response = await http
        .post(`/api/articles/${article.slug}/comments`)
        .set(authHeader(author.token))
        .send({ comment: {} })
        .expect(422);

      expect(response.body.errors.body).toBeDefined();
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('returns comments as a nested tree', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const root = await createComment(app, author.token, article.slug, {
        body: 'root',
      });
      await createComment(app, author.token, article.slug, {
        body: 'child',
        parentId: root.id,
      });

      const response = await http
        .get(`/api/articles/${article.slug}/comments`)
        .expect(200);

      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0]).toMatchObject({
        body: 'root',
        replies: [expect.objectContaining({ body: 'child' })],
      });
    });

    it('flags comments liked by the authenticated user', async () => {
      const author = await registerUser(app, { username: 'author' });
      const liker = await registerUser(app, { username: 'liker' });
      const article = await createArticle(app, author.token);

      const comment = await createComment(app, author.token, article.slug, {
        body: 'likable',
      });

      await http
        .post(`/api/comments/${comment.id}/like`)
        .set(authHeader(liker.token))
        .expect(201);

      const response = await http
        .get(`/api/articles/${article.slug}/comments`)
        .set(authHeader(liker.token))
        .expect(200);

      expect(response.body.comments[0].liked).toBe(true);
    });

    it('returns 404 when the article does not exist', async () => {
      await http.get('/api/articles/missing/comments').expect(404);
    });
  });

  describe('PATCH /api/articles/:slug/comments/:id', () => {
    it('updates the comment body', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug, {
        body: 'original',
      });

      const response = await http
        .patch(`/api/articles/${article.slug}/comments/${comment.id}`)
        .set(authHeader(author.token))
        .send({ comment: { body: 'edited' } })
        .expect(200);

      expect(response.body.comment.body).toBe('edited');

      const rows = await dataSource.query<{ body: string }[]>(
        `SELECT body FROM comments WHERE id = $1`,
        [comment.id],
      );
      expect(rows[0].body).toBe('edited');
    });

    it('returns 403 when not the comment author', async () => {
      const author = await registerUser(app, { username: 'author' });
      const stranger = await registerUser(app, { username: 'stranger' });
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug, {
        body: 'mine',
      });

      const response = await http
        .patch(`/api/articles/${article.slug}/comments/${comment.id}`)
        .set(authHeader(stranger.token))
        .send({ comment: { body: 'hijacked' } })
        .expect(403);

      expect(response.body.errors).toEqual({
        comment: ['you are not the author of this comment'],
      });
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug);

      await http
        .patch(`/api/articles/${article.slug}/comments/${comment.id}`)
        .send({ comment: { body: 'edited' } })
        .expect(401);
    });

    it('returns 404 when the comment does not exist', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      await http
        .patch(`/api/articles/${article.slug}/comments/999999`)
        .set(authHeader(author.token))
        .send({ comment: { body: 'edit' } })
        .expect(404);
    });

    it('returns 422 when the body is empty', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug, {
        body: 'original',
      });

      const response = await http
        .patch(`/api/articles/${article.slug}/comments/${comment.id}`)
        .set(authHeader(author.token))
        .send({ comment: { body: '' } })
        .expect(422);

      expect(response.body.errors.body).toBeDefined();
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('allows the comment author to delete their comment', async () => {
      const author = await registerUser(app, { username: 'author' });
      const commenter = await registerUser(app, { username: 'commenter' });
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, commenter.token, article.slug, {
        body: 'mine',
      });

      await http
        .delete(`/api/articles/${article.slug}/comments/${comment.id}`)
        .set(authHeader(commenter.token))
        .expect(200);

      const rows = await dataSource.query<{ id: number }[]>(
        `SELECT id FROM comments WHERE id = $1`,
        [comment.id],
      );
      expect(rows).toHaveLength(0);
    });

    it('allows the article author to delete any comment', async () => {
      const author = await registerUser(app, { username: 'author' });
      const commenter = await registerUser(app, { username: 'commenter' });
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, commenter.token, article.slug);

      await http
        .delete(`/api/articles/${article.slug}/comments/${comment.id}`)
        .set(authHeader(author.token))
        .expect(200);
    });

    it('returns 403 when the requester is neither the comment nor article author', async () => {
      const author = await registerUser(app, { username: 'author' });
      const commenter = await registerUser(app, { username: 'commenter' });
      const intruder = await registerUser(app, { username: 'intruder' });
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, commenter.token, article.slug);

      const response = await http
        .delete(`/api/articles/${article.slug}/comments/${comment.id}`)
        .set(authHeader(intruder.token))
        .expect(403);

      expect(response.body.errors).toEqual({
        comment: ['you are not authorized to delete this comment'],
      });
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug);

      await http
        .delete(`/api/articles/${article.slug}/comments/${comment.id}`)
        .expect(401);
    });

    it('returns 404 when the comment does not exist', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      await http
        .delete(`/api/articles/${article.slug}/comments/999999`)
        .set(authHeader(author.token))
        .expect(404);
    });
  });

  describe('POST /api/comments/:id/like', () => {
    it('likes a comment and increments the like count', async () => {
      const author = await registerUser(app, { username: 'author' });
      const liker = await registerUser(app, { username: 'liker' });
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug);

      const response = await http
        .post(`/api/comments/${comment.id}/like`)
        .set(authHeader(liker.token))
        .expect(201);

      expect(response.body.comment).toMatchObject({
        likesCount: 1,
        liked: true,
      });

      const commentRows = await dataSource.query<{ likesCount: number }[]>(
        `SELECT "likesCount" FROM comments WHERE id = $1`,
        [comment.id],
      );
      expect(commentRows[0].likesCount).toBe(1);

      const likeRows = await dataSource.query<{ userId: number }[]>(
        `SELECT "userId" FROM comment_likes WHERE "commentId" = $1`,
        [comment.id],
      );
      expect(likeRows).toEqual([{ userId: liker.id }]);
    });

    it('returns 400 when already liked', async () => {
      const author = await registerUser(app, { username: 'author' });
      const liker = await registerUser(app, { username: 'liker' });
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug);

      await http
        .post(`/api/comments/${comment.id}/like`)
        .set(authHeader(liker.token))
        .expect(201);

      const response = await http
        .post(`/api/comments/${comment.id}/like`)
        .set(authHeader(liker.token))
        .expect(400);

      expect(response.body.errors).toEqual({ comment: ['already liked'] });
    });

    it('returns 404 when the comment does not exist', async () => {
      const user = await registerUser(app);

      await http
        .post('/api/comments/999999/like')
        .set(authHeader(user.token))
        .expect(404);
    });

    it('returns 401 without a token', async () => {
      await http.post('/api/comments/1/like').expect(401);
    });
  });

  describe('DELETE /api/comments/:id/like', () => {
    it('removes a like', async () => {
      const author = await registerUser(app, { username: 'author' });
      const liker = await registerUser(app, { username: 'liker' });
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug);

      await http
        .post(`/api/comments/${comment.id}/like`)
        .set(authHeader(liker.token))
        .expect(201);

      const response = await http
        .delete(`/api/comments/${comment.id}/like`)
        .set(authHeader(liker.token))
        .expect(200);

      expect(response.body.comment).toMatchObject({
        likesCount: 0,
        liked: false,
      });

      const likeRows = await dataSource.query<{ userId: number }[]>(
        `SELECT "userId" FROM comment_likes WHERE "commentId" = $1`,
        [comment.id],
      );
      expect(likeRows).toHaveLength(0);
    });

    it('returns 400 when the comment is not liked', async () => {
      const author = await registerUser(app, { username: 'author' });
      const liker = await registerUser(app, { username: 'liker' });
      const article = await createArticle(app, author.token);
      const comment = await createComment(app, author.token, article.slug);

      const response = await http
        .delete(`/api/comments/${comment.id}/like`)
        .set(authHeader(liker.token))
        .expect(400);

      expect(response.body.errors).toEqual({ comment: ['not liked'] });
    });

    it('returns 404 when the comment does not exist', async () => {
      const user = await registerUser(app);

      await http
        .delete('/api/comments/999999/like')
        .set(authHeader(user.token))
        .expect(404);
    });

    it('returns 401 without a token', async () => {
      await http.delete('/api/comments/1/like').expect(401);
    });
  });
});
