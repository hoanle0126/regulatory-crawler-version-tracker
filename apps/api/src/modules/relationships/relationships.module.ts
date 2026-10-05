import { Module } from '@nestjs/common';
import { RelationshipsService } from './relationships.service.js';
import { RelationshipsController } from './relationships.controller.js';
import { PrismaService } from '../../common/prisma.service.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [AuditLogsModule],
  controllers: [RelationshipsController],
  providers: [RelationshipsService, PrismaService],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}
