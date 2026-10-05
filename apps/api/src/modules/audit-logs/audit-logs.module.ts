import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.js';
import { AuditLogsController } from './audit-logs.controller.js';
import { PrismaService } from '../../common/prisma.service.js';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, PrismaService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
