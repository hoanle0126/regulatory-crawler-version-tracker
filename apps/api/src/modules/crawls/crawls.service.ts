import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service.js';
import { CrawlRunStatus } from '@regtracker/shared';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';

@Injectable()
export class CrawlsService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @InjectQueue('crawl-queue') private crawlQueue: Queue,
    @Inject(AuditLogsService) private auditLogsService: AuditLogsService
  ) {}

  public async findAll(query: PaginationQueryDto, sourceId?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (sourceId) where.sourceId = sourceId;

    const [items, total] = await Promise.all([
      this.prisma.crawlRun.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { startedAt: 'desc' },
        include: {
          source: {
            select: { id: true, name: true, baseUrl: true, adapterType: true },
          },
        },
      }),
      this.prisma.crawlRun.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  public async findOne(id: string) {
    const run = await this.prisma.crawlRun.findUnique({
      where: { id },
      include: {
        source: true,
        jobs: true,
      },
    });
    if (!run) throw new NotFoundException(`Crawl run ${id} not found`);
    return run;
  }

  public async triggerCrawl(sourceId: string, actorEmail?: string, triggeredBy: string = 'MANUAL') {
    const source = await this.prisma.regulatorySource.findUnique({
      where: { id: sourceId },
    });
    if (!source) throw new NotFoundException(`Regulatory source ${sourceId} not found`);

    const crawlRun = await this.prisma.crawlRun.create({
      data: {
        sourceId: source.id,
        status: CrawlRunStatus.PENDING,
        triggeredBy,
      },
    });

    await this.crawlQueue.add('execute-crawl', {
      crawlRunId: crawlRun.id,
      sourceId: source.id,
    });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'CRAWL_RUN_TRIGGERED',
      entityType: 'CrawlRun',
      entityId: crawlRun.id,
      details: { sourceId: source.id, sourceName: source.name, triggeredBy },
    });

    return crawlRun;
  }

  public async retryCrawl(crawlRunId: string, actorEmail?: string) {
    const oldRun = await this.findOne(crawlRunId);
    return this.triggerCrawl(oldRun.sourceId, actorEmail, `RETRY:${oldRun.id}`);
  }
}
