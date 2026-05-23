import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp } from './helpers/test-app';
import { cleanDatabase } from './helpers/db';
import { authHeader, registerUser } from './helpers/auth';

describe('Profiles (e2e)', () => {
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

  describe('GET /api/profiles/:username', () => {
    it('returns a profile for an anonymous request', async () => {
      const profile = await registerUser(app, { username: 'profile_user' });

      const response = await http
        .get(`/api/profiles/${profile.username}`)
        .expect(200);

      expect(response.body.profile).toEqual({
        username: profile.username,
        bio: '',
        image: '',
        following: false,
      });
    });

    it('returns following=false when the current user does not follow the profile', async () => {
      const viewer = await registerUser(app, { username: 'viewer' });
      const profile = await registerUser(app, { username: 'unfollowed' });

      const response = await http
        .get(`/api/profiles/${profile.username}`)
        .set(authHeader(viewer.token))
        .expect(200);

      expect(response.body.profile.following).toBe(false);
    });

    it('returns following=true when the current user follows the profile', async () => {
      const viewer = await registerUser(app, { username: 'viewer' });
      const profile = await registerUser(app, { username: 'profile_user' });

      await http
        .post(`/api/profiles/${profile.username}/follow`)
        .set(authHeader(viewer.token))
        .expect(201);

      const response = await http
        .get(`/api/profiles/${profile.username}`)
        .set(authHeader(viewer.token))
        .expect(200);

      expect(response.body.profile.following).toBe(true);
    });

    it('returns 404 when the profile user does not exist', async () => {
      const response = await http.get('/api/profiles/ghost').expect(404);
      expect(response.body.errors).toEqual({ user: ['not found'] });
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('creates a follow relationship and returns following=true', async () => {
      const follower = await registerUser(app, { username: 'follower' });
      const target = await registerUser(app, { username: 'target' });

      const response = await http
        .post(`/api/profiles/${target.username}/follow`)
        .set(authHeader(follower.token))
        .expect(201);

      expect(response.body.profile).toMatchObject({
        username: target.username,
        following: true,
      });

      const rows = await dataSource.query<
        { followerId: number; followingId: number }[]
      >(`SELECT "followerId", "followingId" FROM follows`);
      expect(rows).toEqual([
        { followerId: follower.id, followingId: target.id },
      ]);
    });

    it('returns 400 when the user tries to follow themselves', async () => {
      const user = await registerUser(app, { username: 'self_lover' });

      const response = await http
        .post(`/api/profiles/${user.username}/follow`)
        .set(authHeader(user.token))
        .expect(400);

      expect(response.body.errors).toEqual({
        user: ['cannot follow yourself'],
      });
    });

    it('returns 400 when already following', async () => {
      const follower = await registerUser(app, { username: 'follower' });
      const target = await registerUser(app, { username: 'target' });

      await http
        .post(`/api/profiles/${target.username}/follow`)
        .set(authHeader(follower.token))
        .expect(201);

      const response = await http
        .post(`/api/profiles/${target.username}/follow`)
        .set(authHeader(follower.token))
        .expect(400);

      expect(response.body.errors).toEqual({
        profile: ['already following this user'],
      });
    });

    it('returns 401 without a token', async () => {
      const target = await registerUser(app, { username: 'target' });

      await http.post(`/api/profiles/${target.username}/follow`).expect(401);
    });

    it('returns 404 when the target user does not exist', async () => {
      const follower = await registerUser(app);

      await http
        .post('/api/profiles/ghost/follow')
        .set(authHeader(follower.token))
        .expect(404);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('removes a follow relationship and returns following=false', async () => {
      const follower = await registerUser(app, { username: 'follower' });
      const target = await registerUser(app, { username: 'target' });

      await http
        .post(`/api/profiles/${target.username}/follow`)
        .set(authHeader(follower.token))
        .expect(201);

      const response = await http
        .delete(`/api/profiles/${target.username}/follow`)
        .set(authHeader(follower.token))
        .expect(200);

      expect(response.body.profile).toMatchObject({
        username: target.username,
        following: false,
      });

      const rows = await dataSource.query<{ id: number }[]>(
        `SELECT id FROM follows`,
      );
      expect(rows).toHaveLength(0);
    });

    it('returns 400 when not following', async () => {
      const follower = await registerUser(app, { username: 'follower' });
      const target = await registerUser(app, { username: 'target' });

      const response = await http
        .delete(`/api/profiles/${target.username}/follow`)
        .set(authHeader(follower.token))
        .expect(400);

      expect(response.body.errors).toEqual({
        profile: ['you are not following this user'],
      });
    });

    it('returns 400 when trying to unfollow yourself', async () => {
      const user = await registerUser(app, { username: 'self_lover' });

      const response = await http
        .delete(`/api/profiles/${user.username}/follow`)
        .set(authHeader(user.token))
        .expect(400);

      expect(response.body.errors).toEqual({
        user: ['cannot follow yourself'],
      });
    });

    it('returns 401 without a token', async () => {
      const target = await registerUser(app, { username: 'target' });

      await http.delete(`/api/profiles/${target.username}/follow`).expect(401);
    });

    it('returns 404 when the target user does not exist', async () => {
      const follower = await registerUser(app);

      await http
        .delete('/api/profiles/ghost/follow')
        .set(authHeader(follower.token))
        .expect(404);
    });
  });
});
