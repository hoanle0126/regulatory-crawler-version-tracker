import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhookProcessor } from './webhook.processor.js';
import { PrismaService } from '../../common/prisma.service.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhook-queue',
    }),
    AuditLogsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookProcessor, PrismaService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
