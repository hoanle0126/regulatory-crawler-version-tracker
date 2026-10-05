import { Module } from '@nestjs/common';
import { ChangesService } from './changes.service.js';
import { ChangesController } from './changes.controller.js';
import { PrismaService } from '../../common/prisma.service.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [AuditLogsModule],
  controllers: [ChangesController],
  providers: [ChangesService, PrismaService],
  exports: [ChangesService],
})
export class ChangesModule {}
