import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { DocumentsController } from './documents.controller.js';
import { PrismaService } from '../../common/prisma.service.js';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
