import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface RegisteredUser {
  id: number;
  email: string;
  username: string;
  bio: string;
  image: string;
  token: string;
}

const uniqueSuffix = () =>
  `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

export async function registerUser(
  app: INestApplication,
  overrides: Partial<{
    username: string;
    email: string;
    password: string;
  }> = {},
): Promise<RegisteredUser> {
  const suffix = uniqueSuffix();
  const dto = {
    username: overrides.username ?? `user_${suffix}`,
    email: overrides.email ?? `user_${suffix}@example.com`,
    password: overrides.password ?? 'password123',
  };

  const response = await request(app.getHttpServer())
    .post('/api/users')
    .send({ user: dto })
    .expect(201);

  return response.body.user as RegisteredUser;
}

export const authHeader = (token: string): { Authorization: string } => ({
  Authorization: `Token ${token}`,
});
