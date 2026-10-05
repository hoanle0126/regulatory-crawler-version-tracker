import { Module } from '@nestjs/common';
import { DiffService } from './diff.service.js';
import { DiffController } from './diff.controller.js';
import { PrismaService } from '../../common/prisma.service.js';

@Module({
  controllers: [DiffController],
  providers: [DiffService, PrismaService],
  exports: [DiffService],
})
export class DiffModule {}
