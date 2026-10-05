import { Module } from '@nestjs/common';
import { SourcesService } from './sources.service.js';
import { SourcesController } from './sources.controller.js';
import { PrismaService } from '../../common/prisma.service.js';
import { CrawlsModule } from '../crawls/crawls.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [CrawlsModule, AuditLogsModule],
  controllers: [SourcesController],
  providers: [SourcesService, PrismaService],
  exports: [SourcesService],
})
export class SourcesModule {}
