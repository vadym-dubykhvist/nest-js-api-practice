import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { AppModule } from '@app/app.module';

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();

  const dataSource = app.get(DataSource);
  return { app, dataSource };
}
