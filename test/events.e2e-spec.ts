import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp } from './helpers/test-app';
import { cleanDatabase } from './helpers/db';
import { authHeader, registerUser } from './helpers/auth';

describe('Events (e2e)', () => {
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

  const futureEvent = (overrides: Partial<Record<string, unknown>> = {}) => ({
    title: 'NestJS Meetup',
    description: 'Hands-on workshop.',
    location: 'Kyiv',
    startDate: '2030-09-15T18:00:00.000Z',
    endDate: '2030-09-15T21:00:00.000Z',
    tags: ['nestjs'],
    maxGuests: 100,
    ...overrides,
  });

  const createEvent = async (
    token: string,
    overrides: Partial<Record<string, unknown>> = {},
  ) => {
    const response = await http
      .post('/api/events')
      .set(authHeader(token))
      .send({ event: futureEvent(overrides) })
      .expect(201);
    return response.body.event as {
      id: number;
      title: string;
      author: { id: number };
    };
  };

  const registerForEvent = async (
    token: string,
    eventId: number,
    payload: Record<string, unknown> = {},
  ) => {
    await http
      .post(`/api/events/${eventId}/register`)
      .set(authHeader(token))
      .send({ registration: payload })
      .expect(201);
  };

  const rateEvent = async (token: string, eventId: number, score: number) => {
    await http
      .post(`/api/events/${eventId}/rating`)
      .set(authHeader(token))
      .send({ rating: { score } })
      .expect(201);
  };

  describe('POST /api/events', () => {
    it('creates an event for the authenticated user', async () => {
      const author = await registerUser(app);

      const response = await http
        .post('/api/events')
        .set(authHeader(author.token))
        .send({ event: futureEvent() })
        .expect(201);

      expect(response.body.event).toMatchObject({
        id: expect.any(Number),
        title: 'NestJS Meetup',
        location: 'Kyiv',
        tags: ['nestjs'],
        registeredCount: 0,
        rating: 0,
        author: expect.objectContaining({ id: author.id }),
      });
    });

    it('returns 401 without a token', async () => {
      await http.post('/api/events').send({ event: futureEvent() }).expect(401);
    });

    it('returns 422 when required fields are missing', async () => {
      const author = await registerUser(app);

      const response = await http
        .post('/api/events')
        .set(authHeader(author.token))
        .send({ event: { description: 'no title' } })
        .expect(422);

      expect(response.body.errors).toMatchObject({
        title: expect.any(Array),
        startDate: expect.any(Array),
        endDate: expect.any(Array),
      });
    });

    it('returns 422 when endDate is not after startDate', async () => {
      const author = await registerUser(app);

      const response = await http
        .post('/api/events')
        .set(authHeader(author.token))
        .send({
          event: futureEvent({
            startDate: '2030-09-15T21:00:00.000Z',
            endDate: '2030-09-15T18:00:00.000Z',
          }),
        })
        .expect(422);

      expect(response.body.errors).toEqual({
        endDate: ['must be after startDate'],
      });
    });

    it('returns 422 when dates are not ISO strings', async () => {
      const author = await registerUser(app);

      const response = await http
        .post('/api/events')
        .set(authHeader(author.token))
        .send({
          event: futureEvent({
            startDate: 'not-a-date',
            endDate: 'also-bad',
          }),
        })
        .expect(422);

      expect(response.body.errors.startDate).toBeDefined();
      expect(response.body.errors.endDate).toBeDefined();
    });
  });

  describe('GET /api/events', () => {
    it('returns events ordered by startDate ascending', async () => {
      const author = await registerUser(app);

      const later = await createEvent(author.token, {
        title: 'Later',
        startDate: '2031-01-01T10:00:00.000Z',
        endDate: '2031-01-01T12:00:00.000Z',
      });
      const earlier = await createEvent(author.token, {
        title: 'Earlier',
        startDate: '2030-01-01T10:00:00.000Z',
        endDate: '2030-01-01T12:00:00.000Z',
      });

      const response = await http.get('/api/events').expect(200);

      expect(response.body.eventsCount).toBe(2);
      const ids = (response.body.events as { id: number }[]).map((e) => e.id);
      expect(ids).toEqual([earlier.id, later.id]);
    });

    it('filters by author username', async () => {
      const alice = await registerUser(app, { username: 'alice' });
      const bob = await registerUser(app, { username: 'bob' });

      await createEvent(alice.token, { title: 'Alice event' });
      await createEvent(bob.token, { title: 'Bob event' });

      const response = await http
        .get('/api/events')
        .query({ author: 'alice' })
        .expect(200);

      expect(response.body.eventsCount).toBe(1);
      expect(response.body.events[0].author.username).toBe('alice');
    });

    it('returns an empty list when filtering by an unknown author', async () => {
      const author = await registerUser(app);
      await createEvent(author.token);

      const response = await http
        .get('/api/events')
        .query({ author: 'ghost' })
        .expect(200);

      expect(response.body).toEqual({ events: [], eventsCount: 0 });
    });

    it('filters by tag', async () => {
      const author = await registerUser(app);

      await createEvent(author.token, { title: 'Tagged', tags: ['nestjs'] });
      await createEvent(author.token, { title: 'Other', tags: ['react'] });

      const response = await http
        .get('/api/events')
        .query({ tag: 'nestjs' })
        .expect(200);

      expect(response.body.eventsCount).toBe(1);
      expect(response.body.events[0].tags).toContain('nestjs');
    });

    it('filters by location (case-insensitive)', async () => {
      const author = await registerUser(app);

      await createEvent(author.token, { title: 'KyivOne', location: 'Kyiv' });
      await createEvent(author.token, { title: 'Lviv', location: 'Lviv' });

      const response = await http
        .get('/api/events')
        .query({ location: 'kyiv' })
        .expect(200);

      expect(response.body.eventsCount).toBe(1);
      expect(response.body.events[0].location).toBe('Kyiv');
    });

    it('paginates results via limit and offset', async () => {
      const author = await registerUser(app);

      for (let i = 0; i < 3; i++) {
        await createEvent(author.token, {
          title: `Event ${i}`,
          startDate: `203${i}-01-01T10:00:00.000Z`,
          endDate: `203${i}-01-01T12:00:00.000Z`,
        });
      }

      const response = await http
        .get('/api/events')
        .query({ limit: 1, offset: 1 })
        .expect(200);

      expect(response.body.eventsCount).toBe(3);
      expect(response.body.events).toHaveLength(1);
    });
  });

  describe('GET /api/events/:id', () => {
    it('returns an event by id', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      const response = await http.get(`/api/events/${event.id}`).expect(200);

      expect(response.body.event).toMatchObject({
        id: event.id,
        title: event.title,
      });
    });

    it('returns 404 when the event does not exist', async () => {
      const response = await http.get('/api/events/999999').expect(404);

      expect(response.body.errors).toEqual({ event: ['not found'] });
    });

    it('returns 400 when the id is not an integer', async () => {
      await http.get('/api/events/not-a-number').expect(400);
    });
  });

  describe('PATCH /api/events/:id', () => {
    it('updates an event owned by the user', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      const response = await http
        .patch(`/api/events/${event.id}`)
        .set(authHeader(author.token))
        .send({ event: { title: 'Updated title', location: 'Lviv' } })
        .expect(200);

      expect(response.body.event).toMatchObject({
        title: 'Updated title',
        location: 'Lviv',
      });

      const rows = await dataSource.query<
        { title: string; location: string }[]
      >(`SELECT title, location FROM events WHERE id = $1`, [event.id]);
      expect(rows[0]).toEqual({ title: 'Updated title', location: 'Lviv' });
    });

    it('returns 403 when not the author', async () => {
      const author = await registerUser(app, { username: 'author' });
      const intruder = await registerUser(app, { username: 'intruder' });
      const event = await createEvent(author.token);

      const response = await http
        .patch(`/api/events/${event.id}`)
        .set(authHeader(intruder.token))
        .send({ event: { title: 'Hijack' } })
        .expect(403);

      expect(response.body.errors).toEqual({
        event: ['you are not the author of this event'],
      });
    });

    it('returns 422 when the updated dates are inconsistent', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      const response = await http
        .patch(`/api/events/${event.id}`)
        .set(authHeader(author.token))
        .send({
          event: {
            startDate: '2030-09-15T21:00:00.000Z',
            endDate: '2030-09-15T18:00:00.000Z',
          },
        })
        .expect(422);

      expect(response.body.errors).toEqual({
        endDate: ['must be after startDate'],
      });
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await http
        .patch(`/api/events/${event.id}`)
        .send({ event: { title: 't' } })
        .expect(401);
    });

    it('returns 404 when the event does not exist', async () => {
      const author = await registerUser(app);

      await http
        .patch('/api/events/999999')
        .set(authHeader(author.token))
        .send({ event: { title: 't' } })
        .expect(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('deletes an event owned by the user', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await http
        .delete(`/api/events/${event.id}`)
        .set(authHeader(author.token))
        .expect(200);

      const rows = await dataSource.query<{ id: number }[]>(
        `SELECT id FROM events WHERE id = $1`,
        [event.id],
      );
      expect(rows).toHaveLength(0);
    });

    it('returns 403 when not the author', async () => {
      const author = await registerUser(app, { username: 'author' });
      const intruder = await registerUser(app, { username: 'intruder' });
      const event = await createEvent(author.token);

      await http
        .delete(`/api/events/${event.id}`)
        .set(authHeader(intruder.token))
        .expect(403);
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await http.delete(`/api/events/${event.id}`).expect(401);
    });
  });

  describe('POST /api/events/:id/register', () => {
    it('registers an authenticated user with profile email/name', async () => {
      const author = await registerUser(app, { username: 'author' });
      const guest = await registerUser(app, {
        username: 'guest',
        email: 'guest@example.com',
      });
      const event = await createEvent(author.token);

      const response = await http
        .post(`/api/events/${event.id}/register`)
        .set(authHeader(guest.token))
        .send({ registration: { additionalInfo: 'Vegan' } })
        .expect(201);

      expect(response.body.registration).toMatchObject({
        id: expect.any(Number),
        email: 'guest@example.com',
        name: 'guest',
        additionalInfo: 'Vegan',
      });

      const eventRows = await dataSource.query<{ registeredCount: number }[]>(
        `SELECT "registeredCount" FROM events WHERE id = $1`,
        [event.id],
      );
      expect(eventRows[0].registeredCount).toBe(1);
    });

    it('registers an anonymous user when email and name are provided', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      const response = await http
        .post(`/api/events/${event.id}/register`)
        .send({
          registration: { email: 'anon@example.com', name: 'Anon User' },
        })
        .expect(201);

      expect(response.body.registration).toMatchObject({
        email: 'anon@example.com',
        name: 'Anon User',
      });
    });

    it('returns 422 when anonymous and missing email or name', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      const response = await http
        .post(`/api/events/${event.id}/register`)
        .send({ registration: {} })
        .expect(422);

      expect(response.body.errors).toEqual({
        registration: [
          'email and name are required for anonymous registration',
        ],
      });
    });

    it('returns 400 when the authenticated user registers twice', async () => {
      const author = await registerUser(app, { username: 'author' });
      const guest = await registerUser(app, { username: 'guest' });
      const event = await createEvent(author.token);

      await registerForEvent(guest.token, event.id);

      const response = await http
        .post(`/api/events/${event.id}/register`)
        .set(authHeader(guest.token))
        .send({ registration: {} })
        .expect(400);

      expect(response.body.errors).toEqual({
        registration: ['already registered'],
      });
    });

    it('returns 400 when the event is full', async () => {
      const author = await registerUser(app, { username: 'author' });
      const guest = await registerUser(app, { username: 'guest' });
      const event = await createEvent(author.token, { maxGuests: 1 });

      await registerForEvent(guest.token, event.id);

      const response = await http
        .post(`/api/events/${event.id}/register`)
        .send({
          registration: { email: 'late@example.com', name: 'Late User' },
        })
        .expect(400);

      expect(response.body.errors).toEqual({ event: ['is full'] });
    });

    it('returns 404 when the event does not exist', async () => {
      await http
        .post('/api/events/999999/register')
        .send({ registration: { email: 'anon@example.com', name: 'A' } })
        .expect(404);
    });
  });

  describe('DELETE /api/events/:id/register', () => {
    it('cancels an existing registration', async () => {
      const author = await registerUser(app, { username: 'author' });
      const guest = await registerUser(app, { username: 'guest' });
      const event = await createEvent(author.token);

      await registerForEvent(guest.token, event.id);

      await http
        .delete(`/api/events/${event.id}/register`)
        .set(authHeader(guest.token))
        .expect(200);

      const rows = await dataSource.query<{ registeredCount: number }[]>(
        `SELECT "registeredCount" FROM events WHERE id = $1`,
        [event.id],
      );
      expect(rows[0].registeredCount).toBe(0);
    });

    it('returns 404 when no registration exists for the user', async () => {
      const author = await registerUser(app, { username: 'author' });
      const guest = await registerUser(app, { username: 'guest' });
      const event = await createEvent(author.token);

      const response = await http
        .delete(`/api/events/${event.id}/register`)
        .set(authHeader(guest.token))
        .expect(404);

      expect(response.body.errors).toEqual({ registration: ['not found'] });
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await http.delete(`/api/events/${event.id}/register`).expect(401);
    });
  });

  describe('POST /api/events/:id/rating', () => {
    it('rates an event and updates the rating average', async () => {
      const author = await registerUser(app, { username: 'author' });
      const rater = await registerUser(app, { username: 'rater' });
      const event = await createEvent(author.token);

      const response = await http
        .post(`/api/events/${event.id}/rating`)
        .set(authHeader(rater.token))
        .send({ rating: { score: 5 } })
        .expect(201);

      expect(response.body.event.rating).toBe(5);

      const rows = await dataSource.query<{ rating: number }[]>(
        `SELECT rating FROM events WHERE id = $1`,
        [event.id],
      );
      expect(rows[0].rating).toBe(5);
    });

    it('returns 400 when already rated', async () => {
      const author = await registerUser(app, { username: 'author' });
      const rater = await registerUser(app, { username: 'rater' });
      const event = await createEvent(author.token);

      await rateEvent(rater.token, event.id, 4);

      const response = await http
        .post(`/api/events/${event.id}/rating`)
        .set(authHeader(rater.token))
        .send({ rating: { score: 5 } })
        .expect(400);

      expect(response.body.errors).toEqual({
        rating: ['already rated, use PATCH to change'],
      });
    });

    it('returns 422 when the score is out of range', async () => {
      const author = await registerUser(app, { username: 'author' });
      const rater = await registerUser(app, { username: 'rater' });
      const event = await createEvent(author.token);

      const response = await http
        .post(`/api/events/${event.id}/rating`)
        .set(authHeader(rater.token))
        .send({ rating: { score: 99 } })
        .expect(422);

      expect(response.body.errors.score).toBeDefined();
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await http
        .post(`/api/events/${event.id}/rating`)
        .send({ rating: { score: 5 } })
        .expect(401);
    });
  });

  describe('PATCH /api/events/:id/rating', () => {
    it('updates an existing rating', async () => {
      const author = await registerUser(app, { username: 'author' });
      const rater = await registerUser(app, { username: 'rater' });
      const event = await createEvent(author.token);

      await rateEvent(rater.token, event.id, 5);

      const response = await http
        .patch(`/api/events/${event.id}/rating`)
        .set(authHeader(rater.token))
        .send({ rating: { score: 1 } })
        .expect(200);

      expect(response.body.event.rating).toBe(1);
    });

    it('returns 404 when no rating exists', async () => {
      const author = await registerUser(app, { username: 'author' });
      const rater = await registerUser(app, { username: 'rater' });
      const event = await createEvent(author.token);

      const response = await http
        .patch(`/api/events/${event.id}/rating`)
        .set(authHeader(rater.token))
        .send({ rating: { score: 3 } })
        .expect(404);

      expect(response.body.errors).toEqual({ rating: ['not found'] });
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await http
        .patch(`/api/events/${event.id}/rating`)
        .send({ rating: { score: 3 } })
        .expect(401);
    });
  });

  describe('DELETE /api/events/:id/rating', () => {
    it('removes the rating and recomputes the average', async () => {
      const author = await registerUser(app, { username: 'author' });
      const rater = await registerUser(app, { username: 'rater' });
      const event = await createEvent(author.token);

      await rateEvent(rater.token, event.id, 5);

      const response = await http
        .delete(`/api/events/${event.id}/rating`)
        .set(authHeader(rater.token))
        .expect(200);

      expect(response.body.event.rating).toBe(0);
    });

    it('returns 404 when no rating exists', async () => {
      const author = await registerUser(app, { username: 'author' });
      const rater = await registerUser(app, { username: 'rater' });
      const event = await createEvent(author.token);

      await http
        .delete(`/api/events/${event.id}/rating`)
        .set(authHeader(rater.token))
        .expect(404);
    });

    it('returns 401 without a token', async () => {
      const author = await registerUser(app);
      const event = await createEvent(author.token);

      await http.delete(`/api/events/${event.id}/rating`).expect(401);
    });
  });
});
