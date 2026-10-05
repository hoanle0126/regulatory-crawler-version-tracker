import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrawlsService } from './crawls.service.js';
import { CrawlsController } from './crawls.controller.js';
import { CrawlProcessor } from './crawl.processor.js';
import { PrismaService } from '../../common/prisma.service.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'crawl-queue',
    }),
    WebhooksModule,
    AuditLogsModule,
  ],
  controllers: [CrawlsController],
  providers: [CrawlsService, CrawlProcessor, PrismaService],
  exports: [CrawlsService],
})
export class CrawlsModule {}
