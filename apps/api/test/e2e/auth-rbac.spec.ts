import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';

describe('Auth & RBAC Security E2E (Prompt Section 34 & 51)', () => {
  let app: INestApplication;
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      })
    );
    app.use((req: any, _res: any, next: any) => {
      next();
    });
    app.useGlobalFilters({
      catch(exception: any, host: any) {
        console.error('SERVER_UNHANDLED_EXCEPTION:', exception);
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception?.getStatus ? exception.getStatus() : 500;
        response.status(status).json({
          statusCode: status,
          message: exception?.message || 'Internal server error',
          stack: exception?.stack,
        });
      },
    });
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('allows public health endpoint without authentication', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  it('rejects protected endpoints without authentication token', async () => {
    const res = await request(app.getHttpServer()).get('/api/sources');
    expect(res.status).toBe(401);
  });

  it('rejects invalid login credentials', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'admin@regtracker.local',
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
  });

  it('authenticates Admin user and returns JWT token', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'admin@regtracker.local',
      password: 'AdminPassword123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    adminToken = res.body.accessToken;
  });

  it('authenticates Viewer user and returns JWT token', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'viewer@regtracker.local',
      password: 'ViewerPassword123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('VIEWER');
    viewerToken = res.body.accessToken;
  });

  it('allows Viewer to read sources', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sources')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('STRICT RBAC: Blocks Viewer from creating a regulatory source (403 Forbidden)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sources')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        name: 'Unauthorized Source',
        baseUrl: 'http://example.com',
        adapterType: 'HTML_LISTING',
      });
    expect(res.status).toBe(403);
  });

  it('STRICT RBAC: Blocks Viewer from triggering a crawl (403 Forbidden)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sources/00000000-0000-0000-0000-000000000001/crawl')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('allows Admin to create a regulatory source', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Created Test Source',
        baseUrl: 'http://localhost:5101',
        adapterType: 'HTML_LISTING',
        allowedDomains: ['localhost:5101'],
        enabled: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Admin Created Test Source');

    // Clean up
    await request(app.getHttpServer())
      .delete(`/api/sources/${res.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });
});
