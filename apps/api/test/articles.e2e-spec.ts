import request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';

import { createArticle } from './helpers/articles';
import { authHeader, registerUser } from './helpers/auth';
import { cleanDatabase } from './helpers/db';
import { createTestApp } from './helpers/test-app';

describe('Articles (e2e)', () => {
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

  const favoriteArticle = async (token: string, slug: string) => {
    await http
      .post(`/api/articles/${slug}/favorite`)
      .set(authHeader(token))
      .expect(201);
  };

  const createEvent = async (token: string) => {
    const response = await http
      .post('/api/events')
      .set(authHeader(token))
      .send({
        event: {
          title: 'NestJS Meetup',
          description: 'Hands-on workshop.',
          location: 'Kyiv',
          startDate: '2030-09-15T18:00:00.000Z',
          endDate: '2030-09-15T21:00:00.000Z',
          tags: ['nestjs'],
          maxGuests: 100,
        },
      })
      .expect(201);
    return response.body.event as { id: number; title: string };
  };

  describe('POST /api/articles', () => {
    it('creates an article for the authenticated user', async () => {
      const author = await registerUser(app);

      const response = await http
        .post('/api/articles')
        .set(authHeader(author.token))
        .send({
          article: {
            title: 'How to build a NestJS API',
            description: 'A short summary.',
            body: 'The full body.',
            tagList: ['nestjs', 'api'],
          },
        })
        .expect(201);

      expect(response.body.article).toMatchObject({
        id: expect.any(Number),
        title: 'How to build a NestJS API',
        description: 'A short summary.',
        body: 'The full body.',
        tagList: ['nestjs', 'api'],
        favoritesCount: 0,
        slug: expect.stringMatching(/^how-to-build-a-nestjs-api-/),
        author: expect.objectContaining({ id: author.id }),
      });
    });

    it('defaults tagList to an empty array when omitted', async () => {
      const author = await registerUser(app);

      const response = await http
        .post('/api/articles')
        .set(authHeader(author.token))
        .send({
          article: {
            title: 'Tagless article',
            description: 'No tags here.',
            body: 'Body content.',
          },
        })
        .expect(201);

      expect(response.body.article.tagList).toEqual([]);
    });

    it('persists the article in the database', async () => {
      const author = await registerUser(app);

      const created = await createArticle(app, author.token, {
        title: 'Persisted article',
      });

      const rows = await dataSource.query<{ title: string; slug: string }[]>(
        `SELECT title, slug FROM articles WHERE id = $1`,
        [created.id],
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].title).toBe('Persisted article');
    });

    it('returns 401 without a token', async () => {
      await http
        .post('/api/articles')
        .send({
          article: {
            title: 'Title',
            description: 'desc',
            body: 'body',
          },
        })
        .expect(401);
    });

    it('returns 422 when required fields are missing', async () => {
      const author = await registerUser(app);

      const response = await http
        .post('/api/articles')
        .set(authHeader(author.token))
        .send({ article: { title: 'only title' } })
        .expect(422);

      expect(response.body.errors).toMatchObject({
        description: expect.any(Array),
        body: expect.any(Array),
      });
    });

    it('returns 404 when linking to a non-existent event', async () => {
      const author = await registerUser(app);

      const response = await http
        .post('/api/articles')
        .set(authHeader(author.token))
        .send({
          article: {
            title: 'Linked',
            description: 'desc',
            body: 'body',
            eventId: 999999,
          },
        })
        .expect(404);

      expect(response.body.errors).toEqual({ event: ['not found'] });
    });

    it('lets a registered attendee write an article for the event', async () => {
      const host = await registerUser(app, { username: 'host' });
      const attendee = await registerUser(app, { username: 'attendee' });
      const event = await createEvent(host.token);

      await http
        .post(`/api/events/${event.id}/register`)
        .set(authHeader(attendee.token))
        .send({ registration: {} })
        .expect(201);

      const response = await http
        .post('/api/articles')
        .set(authHeader(attendee.token))
        .send({
          article: {
            title: 'As an attendee',
            description: 'desc',
            body: 'body',
            eventId: event.id,
          },
        })
        .expect(201);

      expect(response.body.article.event).toMatchObject({ id: event.id });
    });

    it('forbids writing an article for an event you neither host nor attend', async () => {
      const host = await registerUser(app, { username: 'host' });
      const outsider = await registerUser(app, { username: 'outsider' });
      const event = await createEvent(host.token);

      const response = await http
        .post('/api/articles')
        .set(authHeader(outsider.token))
        .send({
          article: {
            title: 'Not allowed',
            description: 'desc',
            body: 'body',
            eventId: event.id,
          },
        })
        .expect(403);

      expect(response.body.errors).toEqual({
        event: ['only the event host or an attendee can write an article'],
      });
    });
  });

  describe('GET /api/articles', () => {
    it('returns articles ordered from newest to oldest', async () => {
      const author = await registerUser(app);

      const first = await createArticle(app, author.token, {
        title: 'Older',
      });
      const second = await createArticle(app, author.token, {
        title: 'Newer',
      });

      const response = await http.get('/api/articles').expect(200);

      expect(response.body.articlesCount).toBe(2);
      const ids = (response.body.articles as { id: number }[]).map((a) => a.id);
      expect(ids).toEqual([second.id, first.id]);
    });

    it('filters by author username', async () => {
      const alice = await registerUser(app, { username: 'alice' });
      const bob = await registerUser(app, { username: 'bob' });

      await createArticle(app, alice.token, { title: 'Alice article' });
      await createArticle(app, bob.token, { title: 'Bob article' });

      const response = await http
        .get('/api/articles')
        .query({ author: 'alice' })
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].author.username).toBe('alice');
    });

    it('filters by tag', async () => {
      const author = await registerUser(app);

      await createArticle(app, author.token, {
        title: 'Tagged',
        tagList: ['nestjs'],
      });
      await createArticle(app, author.token, {
        title: 'Not tagged',
        tagList: ['react'],
      });

      const response = await http
        .get('/api/articles')
        .query({ tag: 'nestjs' })
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].tagList).toContain('nestjs');
    });

    it('filters by favorited username', async () => {
      const author = await registerUser(app, { username: 'author' });
      const fan = await registerUser(app, { username: 'fan' });

      const favorited = await createArticle(app, author.token, {
        title: 'Loved',
      });
      await createArticle(app, author.token, { title: 'Ignored' });

      await favoriteArticle(fan.token, favorited.slug);

      const response = await http
        .get('/api/articles')
        .query({ favorited: 'fan' })
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].slug).toBe(favorited.slug);
    });

    it('paginates results via limit and offset', async () => {
      const author = await registerUser(app);

      for (let i = 0; i < 3; i++) {
        await createArticle(app, author.token, { title: `Article ${i}` });
      }

      const response = await http
        .get('/api/articles')
        .query({ limit: 1, offset: 1 })
        .expect(200);

      expect(response.body.articlesCount).toBe(3);
      expect(response.body.articles).toHaveLength(1);
    });

    it('filters by the event the articles belong to', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await createArticle(app, author.token, {
        title: 'Belongs to event',
        eventId: event.id,
      });
      await createArticle(app, author.token, { title: 'No event' });

      const response = await http
        .get('/api/articles')
        .query({ event: event.id })
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].title).toBe('Belongs to event');
      expect(response.body.articles[0].event).toMatchObject({
        id: event.id,
        title: event.title,
      });
    });

    it('includes the linked event on each article in the list', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await createArticle(app, author.token, { eventId: event.id });

      const response = await http.get('/api/articles').expect(200);

      expect(response.body.articles[0].event).toMatchObject({
        id: event.id,
        title: event.title,
      });
    });

    it('flags articles favorited by the authenticated user', async () => {
      const author = await registerUser(app, { username: 'author' });
      const fan = await registerUser(app, { username: 'fan' });

      const article = await createArticle(app, author.token);

      await favoriteArticle(fan.token, article.slug);

      const response = await http
        .get('/api/articles')
        .set(authHeader(fan.token))
        .expect(200);

      expect(response.body.articles[0].favorited).toBe(true);
    });
  });

  describe('GET /api/articles/feed', () => {
    it('returns articles only from followed authors', async () => {
      const follower = await registerUser(app, { username: 'follower' });
      const followed = await registerUser(app, { username: 'followed' });
      const stranger = await registerUser(app, { username: 'stranger' });

      await http
        .post(`/api/profiles/${followed.username}/follow`)
        .set(authHeader(follower.token))
        .expect(201);

      const followedArticle = await createArticle(app, followed.token, {
        title: 'From followed',
      });
      await createArticle(app, stranger.token, { title: 'From stranger' });

      const response = await http
        .get('/api/articles/feed')
        .set(authHeader(follower.token))
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].id).toBe(followedArticle.id);
    });

    it('returns an empty feed when the user follows no one', async () => {
      const user = await registerUser(app);

      const response = await http
        .get('/api/articles/feed')
        .set(authHeader(user.token))
        .expect(200);

      expect(response.body).toEqual({ articles: [], articlesCount: 0 });
    });

    it('returns 401 without a token', async () => {
      await http.get('/api/articles/feed').expect(401);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns the article by slug', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const response = await http
        .get(`/api/articles/${article.slug}`)
        .expect(200);

      expect(response.body.article).toMatchObject({
        id: article.id,
        slug: article.slug,
        title: article.title,
      });
    });

    it('flags the article as favorited for the viewer who favorited it', async () => {
      const author = await registerUser(app, { username: 'author' });
      const fan = await registerUser(app, { username: 'fan' });
      const article = await createArticle(app, author.token);

      await favoriteArticle(fan.token, article.slug);

      const response = await http
        .get(`/api/articles/${article.slug}`)
        .set(authHeader(fan.token))
        .expect(200);

      expect(response.body.article.favorited).toBe(true);
    });

    it('returns favorited=false for a different viewer', async () => {
      const author = await registerUser(app, { username: 'author' });
      const fan = await registerUser(app, { username: 'fan' });
      const other = await registerUser(app, { username: 'other' });
      const article = await createArticle(app, author.token);

      await favoriteArticle(fan.token, article.slug);

      const response = await http
        .get(`/api/articles/${article.slug}`)
        .set(authHeader(other.token))
        .expect(200);

      expect(response.body.article.favorited).toBe(false);
    });

    it('includes the linked event when the article belongs to one', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);
      const article = await createArticle(app, author.token, {
        eventId: event.id,
      });

      const response = await http
        .get(`/api/articles/${article.slug}`)
        .expect(200);

      expect(response.body.article.event).toMatchObject({
        id: event.id,
        title: event.title,
      });
    });

    it('returns a null event when the article has no event', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const response = await http
        .get(`/api/articles/${article.slug}`)
        .expect(200);

      expect(response.body.article.event).toBeNull();
    });

    it('returns 404 when the article does not exist', async () => {
      const response = await http.get('/api/articles/missing').expect(404);

      expect(response.body.errors).toEqual({ article: ['not found'] });
    });
  });

  describe('PATCH /api/articles/:slug', () => {
    it('updates an article owned by the authenticated user', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const response = await http
        .patch(`/api/articles/${article.slug}`)
        .set(authHeader(author.token))
        .send({
          article: {
            title: 'Updated title',
            description: 'Updated description',
            body: 'Updated body',
          },
        })
        .expect(200);

      expect(response.body.article).toMatchObject({
        title: 'Updated title',
        description: 'Updated description',
        body: 'Updated body',
      });
      expect(response.body.article.slug).toMatch(/^updated-title-/);

      const rows = await dataSource.query<
        { title: string; description: string; body: string }[]
      >(`SELECT title, description, body FROM articles WHERE id = $1`, [
        article.id,
      ]);
      expect(rows[0]).toEqual({
        title: 'Updated title',
        description: 'Updated description',
        body: 'Updated body',
      });
    });

    it('returns 403 when not the author', async () => {
      const author = await registerUser(app, { username: 'author' });
      const intruder = await registerUser(app, { username: 'intruder' });
      const article = await createArticle(app, author.token);

      const response = await http
        .patch(`/api/articles/${article.slug}`)
        .set(authHeader(intruder.token))
        .send({
          article: {
            title: 'Hijacked',
            description: 'x',
            body: 'x',
          },
        })
        .expect(403);

      expect(response.body.errors).toEqual({
        article: ['you are not an author of this article'],
      });
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      await http
        .patch(`/api/articles/${article.slug}`)
        .send({ article: { title: 't', description: 'd', body: 'b' } })
        .expect(401);
    });

    it('returns 404 when the article does not exist', async () => {
      const author = await registerUser(app);

      await http
        .patch('/api/articles/missing')
        .set(authHeader(author.token))
        .send({ article: { title: 't', description: 'd', body: 'b' } })
        .expect(404);
    });

    it('returns 422 when required fields are missing', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      const response = await http
        .patch(`/api/articles/${article.slug}`)
        .set(authHeader(author.token))
        .send({ article: { title: '' } })
        .expect(422);

      expect(response.body.errors).toMatchObject({
        title: expect.any(Array),
        description: expect.any(Array),
        body: expect.any(Array),
      });
    });

    it('forbids re-linking an article to an event the author neither hosts nor attends', async () => {
      const author = await registerUser(app, { username: 'author' });
      const host = await registerUser(app, { username: 'host' });
      const article = await createArticle(app, author.token, {
        title: 'My article',
      });
      const event = await createEvent(host.token);

      const response = await http
        .patch(`/api/articles/${article.slug}`)
        .set(authHeader(author.token))
        .send({
          article: {
            title: 'My article',
            description: 'd',
            body: 'b',
            eventId: event.id,
          },
        })
        .expect(403);

      expect(response.body.errors).toEqual({
        event: ['only the event host or an attendee can write an article'],
      });
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('deletes an article owned by the authenticated user', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      await http
        .delete(`/api/articles/${article.slug}`)
        .set(authHeader(author.token))
        .expect(200);

      const rows = await dataSource.query<{ id: number }[]>(
        `SELECT id FROM articles WHERE id = $1`,
        [article.id],
      );
      expect(rows).toHaveLength(0);
    });

    it('returns 403 when not the author', async () => {
      const author = await registerUser(app, { username: 'author' });
      const intruder = await registerUser(app, { username: 'intruder' });
      const article = await createArticle(app, author.token);

      await http
        .delete(`/api/articles/${article.slug}`)
        .set(authHeader(intruder.token))
        .expect(403);
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      await http.delete(`/api/articles/${article.slug}`).expect(401);
    });

    it('returns 404 when the article does not exist', async () => {
      const author = await registerUser(app);

      await http
        .delete('/api/articles/missing')
        .set(authHeader(author.token))
        .expect(404);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    it('adds the article to the user favorites', async () => {
      const author = await registerUser(app, { username: 'author' });
      const fan = await registerUser(app, { username: 'fan' });
      const article = await createArticle(app, author.token);

      const response = await http
        .post(`/api/articles/${article.slug}/favorite`)
        .set(authHeader(fan.token))
        .expect(201);

      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('returns 400 when already favorited', async () => {
      const author = await registerUser(app, { username: 'author' });
      const fan = await registerUser(app, { username: 'fan' });
      const article = await createArticle(app, author.token);

      await favoriteArticle(fan.token, article.slug);

      const response = await http
        .post(`/api/articles/${article.slug}/favorite`)
        .set(authHeader(fan.token))
        .expect(400);

      expect(response.body.errors).toEqual({ article: ['already favorited'] });
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      await http.post(`/api/articles/${article.slug}/favorite`).expect(401);
    });

    it('returns 404 when the article does not exist', async () => {
      const user = await registerUser(app);

      await http
        .post('/api/articles/missing/favorite')
        .set(authHeader(user.token))
        .expect(404);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    it('removes the article from the user favorites', async () => {
      const author = await registerUser(app, { username: 'author' });
      const fan = await registerUser(app, { username: 'fan' });
      const article = await createArticle(app, author.token);

      await favoriteArticle(fan.token, article.slug);

      const response = await http
        .delete(`/api/articles/${article.slug}/favorite`)
        .set(authHeader(fan.token))
        .expect(200);

      expect(response.body.article.favoritesCount).toBe(0);
    });

    it('returns 400 when the article is not favorited', async () => {
      const author = await registerUser(app, { username: 'author' });
      const fan = await registerUser(app, { username: 'fan' });
      const article = await createArticle(app, author.token);

      const response = await http
        .delete(`/api/articles/${article.slug}/favorite`)
        .set(authHeader(fan.token))
        .expect(400);

      expect(response.body.errors).toEqual({ article: ['not favorited'] });
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const article = await createArticle(app, author.token);

      await http.delete(`/api/articles/${article.slug}/favorite`).expect(401);
    });

    it('returns 404 when the article does not exist', async () => {
      const user = await registerUser(app);

      await http
        .delete('/api/articles/missing/favorite')
        .set(authHeader(user.token))
        .expect(404);
    });
  });
});
