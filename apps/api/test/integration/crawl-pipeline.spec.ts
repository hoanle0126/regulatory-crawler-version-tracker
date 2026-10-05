import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CrawlProcessor } from '../../src/modules/crawls/crawl.processor.js';
import { AdapterFactory, MockRegulatoryAdapter } from '@regtracker/crawler-core';
import { ChangeType, LegalNodeType } from '@regtracker/shared';

describe('End-to-End Crawl, Versioning, and Diff Pipeline (Prompt Sections 5, 18, 19, 50, 54)', () => {
  let prisma: PrismaClient;
  let mockAdapter: MockRegulatoryAdapter;
  let crawlProcessor: CrawlProcessor;
  let testSourceId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    mockAdapter = AdapterFactory.getMockAdapter();

    // Mock WebhooksService
    const mockWebhooksService: any = {
      dispatchDocumentEvent: async () => {},
    };

    crawlProcessor = new CrawlProcessor(prisma as any, mockWebhooksService);

    // Clean up previous test artifacts
    await prisma.document.deleteMany({
      where: { canonicalId: 'doc:01-2026-tt-demo' },
    });
    await prisma.regulatorySource.deleteMany({
      where: { name: 'Integration Test Mock Source' },
    });

    const source = await prisma.regulatorySource.create({
      data: {
        name: 'Integration Test Mock Source',
        baseUrl: 'https://demo-legal-portal.local/docs/01-2026-tt-demo',
        adapterType: 'MOCK_DEMO',
        enabled: true,
        allowedDomains: ['demo-legal-portal.local'],
      },
    });
    testSourceId = source.id;
  });

  afterAll(async () => {
    await prisma.regulatorySource.deleteMany({
      where: { id: testSourceId },
    });
    await prisma.$disconnect();
  });

  it('Stage 1: Crawls Version 1, stores snapshot, extracts legal nodes, creates Version 1', async () => {
    mockAdapter.setVersion(1);

    const crawlRun = await prisma.crawlRun.create({
      data: {
        sourceId: testSourceId,
        status: 'PENDING',
        triggeredBy: 'TEST',
      },
    });

    await crawlProcessor.process({
      data: { crawlRunId: crawlRun.id, sourceId: testSourceId },
    } as any);

    // Verify CrawlRun status
    const completedRun = await prisma.crawlRun.findUnique({ where: { id: crawlRun.id } });
    expect(completedRun?.status).toBe('COMPLETED');
    expect(completedRun?.totalDiscovered).toBe(1);
    expect(completedRun?.totalNew).toBe(1);

    // Verify Document
    const document = await prisma.document.findFirst({
      where: { sourceId: testSourceId },
      include: {
        versions: {
          include: { nodes: true },
        },
      },
    });

    expect(document).toBeDefined();
    expect(document?.documentNumber).toBe('01/2026/TT-DEMO');
    expect(document?.versions.length).toBe(1);

    const v1 = document?.versions[0];
    expect(v1?.versionNumber).toBe(1);
    expect(v1?.normalizedChecksum.length).toBe(64);
    expect(v1?.nodes.length).toBeGreaterThan(0);

    // Verify LegalNodes
    const d5 = v1?.nodes.find((n) => n.type === LegalNodeType.ARTICLE && n.number === '5');
    expect(d5).toBeDefined();

    const k1 = v1?.nodes.find((n) => n.type === LegalNodeType.CLAUSE && n.number === '1');
    expect(k1).toBeDefined();
    expect(k1?.content).toContain('Hồ sơ gồm giấy A');
  });

  it('Stage 2: Idempotent crawl of identical content does NOT create a false substantive version', async () => {
    mockAdapter.setVersion(1); // Content unchanged

    const crawlRun2 = await prisma.crawlRun.create({
      data: {
        sourceId: testSourceId,
        status: 'PENDING',
        triggeredBy: 'TEST_IDEMPOTENT',
      },
    });

    await crawlProcessor.process({
      data: { crawlRunId: crawlRun2.id, sourceId: testSourceId },
    } as any);

    const document = await prisma.document.findFirst({
      where: { sourceId: testSourceId },
      include: { versions: true },
    });

    // Version count MUST still be 1 (No duplicate / false versions)
    expect(document?.versions.length).toBe(1);
  });

  it('Stage 3: Crawls Version 2, detects regulatory changes, generates structured ChangeSet and word diffs', async () => {
    mockAdapter.setVersion(2); // Content changed to Version 2

    const crawlRun3 = await prisma.crawlRun.create({
      data: {
        sourceId: testSourceId,
        status: 'PENDING',
        triggeredBy: 'TEST_V2',
      },
    });

    await crawlProcessor.process({
      data: { crawlRunId: crawlRun3.id, sourceId: testSourceId },
    } as any);

    const completedRun = await prisma.crawlRun.findUnique({ where: { id: crawlRun3.id } });
    expect(completedRun?.status).toBe('COMPLETED');
    expect(completedRun?.totalChanged).toBe(1);

    const document = await prisma.document.findFirst({
      where: { sourceId: testSourceId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: { nodes: true },
        },
        changeSets: {
          include: { items: true },
        },
      },
    });

    expect(document?.versions.length).toBe(2);

    const v2 = document?.versions[0];
    expect(v2?.versionNumber).toBe(2);

    // ChangeSet check
    expect(document?.changeSets.length).toBe(1);
    const cs = document?.changeSets[0];
    expect(cs?.status).toBe('DETECTED');
    expect(cs?.summary).toContain('2 modified clauses, 1 new clause, 0 removed clauses');

    // Individual ChangeItems check
    const items = cs?.items || [];
    expect(items.length).toBeGreaterThanOrEqual(4);

    // Điều 5 Khoản 1 MODIFIED
    const k1 = items.find((i) => i.hierarchyPath.includes('Điều 5') && i.hierarchyPath.endsWith('1'));
    expect(k1?.changeType).toBe(ChangeType.MODIFIED);
    expect(k1?.oldContent).toContain('Hồ sơ gồm giấy A.');
    expect(k1?.newContent).toContain('Hồ sơ gồm giấy A và giấy B.');
    expect(k1?.diffFragments).toBeDefined();

    // Điều 5 Khoản 3 ADDED
    const k3 = items.find((i) => i.hierarchyPath.includes('Điều 5') && i.hierarchyPath.endsWith('3'));
    expect(k3?.changeType).toBe(ChangeType.ADDED);
    expect(k3?.newContent).toContain('Doanh nghiệp phải lưu hồ sơ trong 3 năm.');

    // Điều 6 MODIFIED
    const d6 = items.find((i) => i.hierarchyPath.includes('Điều 6'));
    expect(d6?.changeType).toBe(ChangeType.MODIFIED);
    expect(d6?.newContent).toContain('nộp hồ sơ điện tử');
  });

  it('Stage 4: Race condition / concurrent crawl safety ensures only ONE version 2 is created', async () => {
    // Re-running on Version 2 should be completely idempotent
    mockAdapter.setVersion(2);

    const crawlRun4 = await prisma.crawlRun.create({
      data: {
        sourceId: testSourceId,
        status: 'PENDING',
        triggeredBy: 'TEST_RACE_DUPLICATE',
      },
    });

    await crawlProcessor.process({
      data: { crawlRunId: crawlRun4.id, sourceId: testSourceId },
    } as any);

    const document = await prisma.document.findFirst({
      where: { sourceId: testSourceId },
      include: { versions: true, changeSets: true },
    });

    // Still exactly 2 versions and 1 changeset
    expect(document?.versions.length).toBe(2);
    expect(document?.changeSets.length).toBe(1);
  });
});
