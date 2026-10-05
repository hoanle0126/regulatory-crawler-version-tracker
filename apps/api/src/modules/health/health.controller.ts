import { Controller, Get, Res, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../../common/prisma.service.js';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health & Monitoring')
@Controller()
export class HealthController {
  private redisClient: Redis;

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6381';
    this.redisClient = new Redis(redisUrl, { lazyConnect: true });
  }

  @Get('health')
  @ApiOperation({ summary: 'Liveness check for API process' })
  getLiveness() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness check for PostgreSQL and Redis connectivity' })
  async getReadiness(@Res() res: Response) {
    const checks: Record<string, { status: 'UP' | 'DOWN'; message?: string }> = {};
    let isReady = true;

    // 1. PostgreSQL check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks['database'] = { status: 'UP' };
    } catch (err: unknown) {
      isReady = false;
      checks['database'] = {
        status: 'DOWN',
        message: err instanceof Error ? err.message : String(err),
      };
    }

    // 2. Redis check
    try {
      if (this.redisClient.status !== 'ready') {
        await this.redisClient.connect();
      }
      const ping = await this.redisClient.ping();
      if (ping === 'PONG') {
        checks['redis'] = { status: 'UP' };
      } else {
        throw new Error(`Unexpected Redis ping response: ${ping}`);
      }
    } catch (err: unknown) {
      isReady = false;
      checks['redis'] = {
        status: 'DOWN',
        message: err instanceof Error ? err.message : String(err),
      };
    }

    const httpStatus = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(httpStatus).json({
      status: isReady ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      checks,
    });
  }
}
