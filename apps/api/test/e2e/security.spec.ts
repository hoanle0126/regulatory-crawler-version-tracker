import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import helmet from 'helmet';
import { AppModule } from '../../src/app.module.js';

describe('Security & SSRF Protections E2E (Sections 10, 45, 46, 52)', () => {
  let app: INestApplication;
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(helmet());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );
    app.setGlobalPrefix('api');
    app.useGlobalFilters({
      catch(exception: any, host: any) {
        console.error('SECURITY_TEST_EXCEPTION:', exception);
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception?.getStatus ? exception.getStatus() : 500;
        response.status(status).json({
          statusCode: status,
          message: exception?.message || 'Internal server error',
          error: exception?.getResponse ? exception.getResponse() : undefined,
        });
      },
    });
    await app.init();

    // Authenticate Admin
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@regtracker.local', password: 'AdminPassword123!' });
    adminToken = adminRes.body.accessToken;

    // Authenticate Viewer
    const viewerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'viewer@regtracker.local', password: 'ViewerPassword123!' });
    viewerToken = viewerRes.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Security Headers (Helmet)', () => {
    it('enforces secure HTTP response headers', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('SSRF Protection (Prompt Section 10 & 52)', () => {
    const SSRF_TARGETS = [
      { url: 'http://localhost', desc: 'localhost' },
      { url: 'http://127.0.0.1:8080', desc: '127.0.0.1 loopback' },
      { url: 'http://0.0.0.0:80', desc: '0.0.0.0 loopback/unspecified' },
      { url: 'http://169.254.169.254/latest/meta-data/', desc: 'AWS/GCP metadata address' },
      { url: 'http://10.0.0.1/admin', desc: 'Private Class A 10.0.0.0/8' },
      { url: 'http://172.16.0.1:9000', desc: 'Private Class B 172.16.0.0/12' },
      { url: 'http://192.168.1.1/router', desc: 'Private Class C 192.168.0.0/16' },
      { url: 'file:///etc/passwd', desc: 'file protocol smuggling' },
      { url: 'gopher://127.0.0.1:6379/_INFO', desc: 'gopher protocol smuggling' },
      { url: 'ftp://ftp.example.com/files', desc: 'ftp protocol' },
    ];

    for (const target of SSRF_TARGETS) {
      it(`blocks SSRF destination via POST /api/sources/test: ${target.desc}`, async () => {
        const res = await request(app.getHttpServer())
          .post('/api/sources/test')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ url: target.url });

        expect(res.status).toBe(201);
        expect(res.body.reachable).toBe(false);
        expect(res.body.status).toBe('UNSAFE_URL');
        expect(res.body.error).toBeDefined();
      });

      it(`rejects creating a regulatory source targeting SSRF address: ${target.desc}`, async () => {
        const res = await request(app.getHttpServer())
          .post('/api/sources')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: `SSRF Test ${target.desc}`,
            baseUrl: target.url,
            adapterType: 'HTML_LISTING',
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('violates security policy');
      });
    }
  });

  describe('Crawl Frequency & Cron Rate-Limiting (Prompt Section 25 & 52)', () => {
    it('rejects overly aggressive 1-minute crawl intervals', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aggressive Cron Source',
          baseUrl: 'https://example.gov.vn',
          adapterType: 'HTML_LISTING',
          scheduleCron: '* * * * *',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Crawl frequency is too aggressive');
    });

    it('rejects 1-minute step intervals (*/1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aggressive Step Cron Source',
          baseUrl: 'https://example.gov.vn',
          adapterType: 'HTML_LISTING',
          scheduleCron: '*/1 * * * *',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Crawl frequency is too aggressive');
    });

    it('rejects malformed cron expressions with invalid field count', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Cron Source',
          baseUrl: 'https://example.gov.vn',
          adapterType: 'HTML_LISTING',
          scheduleCron: 'every 5 minutes',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cron expression must contain exactly 5 space-separated fields');
    });

    it('accepts safe crawl schedules (e.g. daily 0 0 * * * or 6-hourly 0 */6 * * *)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Safe Scheduled Source',
          baseUrl: 'https://vbpl.vn',
          adapterType: 'HTML_LISTING',
          scheduleCron: '0 */6 * * *',
          allowedDomains: ['vbpl.vn'],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();

      // Clean up test source
      await request(app.getHttpServer())
        .delete(`/api/sources/${res.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });

  describe('RBAC & Privilege Escalation Defenses (Section 34)', () => {
    it('prevents VIEWER from creating webhook endpoints', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Viewer Webhook',
          url: 'https://receiver.example.com/webhook',
          events: ['DOCUMENT_CHANGED'],
        });

      expect(res.status).toBe(403);
    });

    it('prevents VIEWER from modifying document relationships', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/documents/00000000-0000-0000-0000-000000000001/relationships')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          targetDocumentId: '00000000-0000-0000-0000-000000000002',
          relationshipType: 'AMENDS',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Input Validation & SQL Injection Resilience (Section 46 & 52)', () => {
    it('handles SQL injection payloads in UUID parameters safely (returns 400/404, never 500)', async () => {
      const sqliPayload = "00000000-0000-0000-0000-000000000001' OR '1'='1";
      const res = await request(app.getHttpServer())
        .get(`/api/documents/${encodeURIComponent(sqliPayload)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });

    it('enforces pagination safety on large limits', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/documents?page=1&pageSize=999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});
