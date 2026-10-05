import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../../common/prisma.service.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class HealthModule {}
