import { Module } from '@nestjs/common';
import { VersionsService } from './versions.service.js';
import { VersionsController } from './versions.controller.js';
import { PrismaService } from '../../common/prisma.service.js';

@Module({
  controllers: [VersionsController],
  providers: [VersionsService, PrismaService],
  exports: [VersionsService],
})
export class VersionsModule {}
