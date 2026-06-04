import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp } from './helpers/test-app';
import { cleanDatabase } from './helpers/db';

describe('Tags (e2e)', () => {
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

  describe('GET /api/tags', () => {
    it('returns an empty list when no tags exist', async () => {
      const response = await http.get('/api/tags').expect(200);
      expect(response.body).toEqual({ tags: [] });
    });

    it('returns all tag names from the database', async () => {
      await dataSource.query(
        `INSERT INTO tags (name) VALUES ('nestjs'), ('typescript'), ('postgres')`,
      );

      const response = await http.get('/api/tags').expect(200);

      expect(response.body.tags).toEqual(
        expect.arrayContaining(['nestjs', 'typescript', 'postgres']),
      );
      expect(response.body.tags).toHaveLength(3);
    });
  });
});
