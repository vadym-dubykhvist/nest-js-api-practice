import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp } from './helpers/test-app';
import { cleanDatabase } from './helpers/db';
import { authHeader, registerUser } from './helpers/auth';

describe('Users (e2e)', () => {
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

  describe('POST /api/users', () => {
    const validUser = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('registers a new user and returns a token', async () => {
      const response = await http
        .post('/api/users')
        .send({ user: validUser })
        .expect(201);

      expect(response.body.user).toMatchObject({
        id: expect.any(Number),
        username: validUser.username,
        email: validUser.email,
        bio: '',
        image: '',
        token: expect.any(String),
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('persists the user in the database', async () => {
      await http.post('/api/users').send({ user: validUser }).expect(201);

      const rows = await dataSource.query<
        { email: string; username: string }[]
      >(`SELECT email, username FROM users WHERE email = $1`, [
        validUser.email,
      ]);

      expect(rows).toHaveLength(1);
      expect(rows[0].username).toBe(validUser.username);
    });

    it('hashes the password before storing it', async () => {
      await http.post('/api/users').send({ user: validUser }).expect(201);

      const rows = await dataSource.query<{ password: string }[]>(
        `SELECT password FROM users WHERE email = $1`,
        [validUser.email],
      );
      expect(rows[0].password).not.toBe(validUser.password);
      expect(rows[0].password).toMatch(/^\$2[aby]\$/);
    });

    it('returns 422 when email is already taken', async () => {
      await http.post('/api/users').send({ user: validUser }).expect(201);

      const response = await http
        .post('/api/users')
        .send({ user: { ...validUser, username: 'someone_else' } })
        .expect(422);

      expect(response.body.errors.email).toEqual(['has already been taken']);
    });

    it('returns 422 when username is already taken', async () => {
      await http.post('/api/users').send({ user: validUser }).expect(201);

      const response = await http
        .post('/api/users')
        .send({
          user: { ...validUser, email: 'different@example.com' },
        })
        .expect(422);

      expect(response.body.errors.username).toEqual(['has already been taken']);
    });

    it('returns 422 when email format is invalid', async () => {
      const response = await http
        .post('/api/users')
        .send({ user: { ...validUser, email: 'not-an-email' } })
        .expect(422);

      expect(response.body.errors.email).toBeDefined();
    });

    it('returns 422 when required fields are missing', async () => {
      const response = await http
        .post('/api/users')
        .send({ user: { email: 'john@example.com' } })
        .expect(422);

      expect(response.body.errors).toMatchObject({
        username: expect.any(Array),
        password: expect.any(Array),
      });
    });
  });

  describe('POST /api/users/login', () => {
    const credentials = {
      username: 'jane_doe',
      email: 'jane@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      await registerUser(app, credentials);
    });

    it('logs in with valid credentials', async () => {
      const response = await http
        .post('/api/users/login')
        .send({
          user: { email: credentials.email, password: credentials.password },
        })
        .expect(201);

      expect(response.body.user).toMatchObject({
        email: credentials.email,
        username: credentials.username,
        token: expect.any(String),
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('returns 422 with a generic error for invalid password', async () => {
      const response = await http
        .post('/api/users/login')
        .send({
          user: { email: credentials.email, password: 'wrong-password' },
        })
        .expect(422);

      expect(response.body.errors).toEqual({
        'email or password': ['is invalid'],
      });
    });

    it('returns 422 with a generic error when the user does not exist', async () => {
      const response = await http
        .post('/api/users/login')
        .send({
          user: { email: 'nobody@example.com', password: 'password123' },
        })
        .expect(422);

      expect(response.body.errors).toEqual({
        'email or password': ['is invalid'],
      });
    });

    it('returns 422 when email format is invalid', async () => {
      const response = await http
        .post('/api/users/login')
        .send({ user: { email: 'not-an-email', password: 'password123' } })
        .expect(422);

      expect(response.body.errors.email).toBeDefined();
    });
  });

  describe('GET /api/user', () => {
    it('returns the authenticated user', async () => {
      const registered = await registerUser(app);

      const response = await http
        .get('/api/user')
        .set(authHeader(registered.token))
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: registered.id,
        username: registered.username,
        email: registered.email,
        token: registered.token,
      });
    });

    it('returns 401 without a token', async () => {
      await http.get('/api/user').expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await http
        .get('/api/user')
        .set(authHeader('not-a-valid-jwt'))
        .expect(401);
    });
  });

  describe('PATCH /api/user', () => {
    it('updates the authenticated user', async () => {
      const registered = await registerUser(app);

      const update = {
        email: 'updated@example.com',
        bio: 'About me',
        image: 'https://example.com/me.png',
      };

      const response = await http
        .patch('/api/user')
        .set(authHeader(registered.token))
        .send({ user: update })
        .expect(200);

      expect(response.body.user).toMatchObject(update);

      const rows = await dataSource.query<
        { email: string; bio: string; image: string }[]
      >(`SELECT email, bio, image FROM users WHERE id = $1`, [registered.id]);
      expect(rows[0]).toEqual(update);
    });

    it('returns 401 without a token', async () => {
      await http
        .patch('/api/user')
        .send({ user: { email: 'updated@example.com', bio: '', image: '' } })
        .expect(401);
    });

    it('returns 422 when email format is invalid', async () => {
      const registered = await registerUser(app);

      const response = await http
        .patch('/api/user')
        .set(authHeader(registered.token))
        .send({ user: { email: 'not-an-email', bio: '', image: '' } })
        .expect(422);

      expect(response.body.errors.email).toBeDefined();
    });
  });
});
