import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/courses (GET) - should reject missing x-role with 403', () => {
    return request(app.getHttpServer())
      .get('/courses')
      .expect(403);
  });

  it('/courses (GET) - should allow authorized role with 200', () => {
    return request(app.getHttpServer())
      .get('/courses')
      .set('x-role', 'Student')
      .expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});