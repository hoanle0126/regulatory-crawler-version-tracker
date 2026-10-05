import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module.js';
import { SourcesModule } from './modules/sources/sources.module.js';
import { CrawlsModule } from './modules/crawls/crawls.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { VersionsModule } from './modules/versions/versions.module.js';
import { DiffModule } from './modules/diff/diff.module.js';
import { ChangesModule } from './modules/changes/changes.module.js';
import { RelationshipsModule } from './modules/relationships/relationships.module.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6381';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname || 'localhost',
            port: parseInt(url.port || '6381', 10),
            password: url.password || undefined,
          },
        };
      },
    }),
    AuthModule,
    SourcesModule,
    CrawlsModule,
    DocumentsModule,
    VersionsModule,
    DiffModule,
    ChangesModule,
    RelationshipsModule,
    WebhooksModule,
    AuditLogsModule,
    HealthModule,
  ],
})
export class AppModule {}
