import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding RegTracker database...');

  // 1. Create Default Users
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const viewerPasswordHash = await bcrypt.hash('ViewerPassword123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@regtracker.local' },
    update: { passwordHash: adminPasswordHash, role: UserRole.ADMIN },
    create: {
      email: 'admin@regtracker.local',
      name: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@regtracker.local' },
    update: { passwordHash: viewerPasswordHash, role: UserRole.VIEWER },
    create: {
      email: 'viewer@regtracker.local',
      name: 'Compliance Viewer',
      passwordHash: viewerPasswordHash,
      role: UserRole.VIEWER,
    },
  });

  console.log(`Created users: Admin (${admin.email}), Viewer (${viewer.email})`);

  // 2. Create Monitored Sources
  const demoSource = await prisma.regulatorySource.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Cổng Công Báo Bộ Tài Chính (Synthetic Demo)',
      baseUrl: 'http://localhost:5101',
      adapterType: 'HTML_LISTING',
      scheduleCron: '0 */6 * * *',
      enabled: true,
      timeout: 15000,
      retryLimits: 3,
      crawlConcurrency: 2,
      allowedDomains: ['localhost:5101', '127.0.0.1:5101', 'demo-source:5101'],
      documentSelectors: {
        listingContainer: '.listing-container',
        itemLink: '.item-link',
        itemTitle: '.item-link',
        itemNumber: '.item-number',
        itemDate: '.item-date',
      },
    },
  });

  const mockSource = await prisma.regulatorySource.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Mock Regulatory Source (Fixture Adapter)',
      baseUrl: 'https://demo-legal-portal.local/docs/01-2026-tt-demo',
      adapterType: 'MOCK_DEMO',
      scheduleCron: '0 0 * * *',
      enabled: true,
      timeout: 5000,
      retryLimits: 2,
      crawlConcurrency: 1,
      allowedDomains: ['demo-legal-portal.local'],
    },
  });

  console.log(`Created sources: "${demoSource.name}" and "${mockSource.name}"`);

  // 3. Create Demo Webhook Endpoint
  await prisma.webhookEndpoint.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      url: 'http://localhost:4101/api/webhooks/mock-receiver',
      secret: 'webhook_secret_key_demo_2026',
      description: 'Downstream Legal RAG & Compliance Monitoring Service Webhook',
      events: [
        'document.created',
        'document.version.created',
        'document.changed',
        'document.expired',
        'document.replaced',
      ],
      enabled: true,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
