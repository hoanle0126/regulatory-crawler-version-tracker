import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { CreateSourceDto, UpdateSourceDto } from './dto/create-source.dto.js';
import { CrawlsService } from '../crawls/crawls.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { ISourceConfig, SourceTester, SsrfGuard } from '@regtracker/crawler-core';
import { validateCronExpression } from '../../common/utils/cron-validator.js';

@Injectable()
export class SourcesService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CrawlsService) private crawlsService: CrawlsService,
    @Inject(AuditLogsService) private auditLogsService: AuditLogsService
  ) {}

  private async validateConfig(dto: { baseUrl: string; scheduleCron?: string; allowedDomains?: string[] }) {
    if (dto.scheduleCron) {
      const cronResult = validateCronExpression(dto.scheduleCron);
      if (!cronResult.valid) {
        throw new BadRequestException(cronResult.reason);
      }
    }

    const isLocalDemoAllowed =
      (dto.baseUrl.startsWith('http://localhost:5101') ||
        dto.baseUrl.startsWith('http://127.0.0.1:5101') ||
        dto.baseUrl.startsWith('http://demo-source:5101')) &&
      (process.env.ALLOW_LOCAL_DEMO_SOURCES === 'true' ||
        Boolean(dto.allowedDomains?.includes('localhost:5101')) ||
        Boolean(dto.allowedDomains?.includes('127.0.0.1:5101')) ||
        Boolean(dto.allowedDomains?.includes('demo-source:5101')));

    const ssrfCheck = await SsrfGuard.validateUrl(dto.baseUrl, {
      allowLocalhost: isLocalDemoAllowed,
      allowedHosts: dto.allowedDomains,
    });

    if (!ssrfCheck.safe) {
      throw new BadRequestException(`Source baseUrl violates security policy: ${ssrfCheck.reason}`);
    }
  }

  public async findAll() {
    return this.prisma.regulatorySource.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { documents: true, crawlRuns: true },
        },
      },
    });
  }

  public async findOne(id: string) {
    const source = await this.prisma.regulatorySource.findUnique({
      where: { id },
      include: {
        crawlRuns: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { documents: true, crawlRuns: true },
        },
      },
    });
    if (!source) throw new NotFoundException(`Regulatory source ${id} not found`);
    return source;
  }

  public async create(dto: CreateSourceDto, actorEmail?: string) {
    await this.validateConfig({
      baseUrl: dto.baseUrl,
      scheduleCron: dto.scheduleCron,
      allowedDomains: dto.allowedDomains,
    });

    const source = await this.prisma.regulatorySource.create({
      data: {
        name: dto.name,
        baseUrl: dto.baseUrl,
        adapterType: dto.adapterType,
        scheduleCron: dto.scheduleCron,
        enabled: dto.enabled ?? true,
        timeout: dto.timeout ?? 15000,
        retryLimits: dto.retryLimits ?? 2,
        crawlConcurrency: dto.crawlConcurrency ?? 2,
        allowedDomains: dto.allowedDomains ?? [],
        documentSelectors: dto.documentSelectors || undefined,
      },
    });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'SOURCE_CREATED',
      entityType: 'RegulatorySource',
      entityId: source.id,
      details: { name: source.name, baseUrl: source.baseUrl, adapterType: source.adapterType },
    });

    return source;
  }

  public async update(id: string, dto: UpdateSourceDto, actorEmail?: string) {
    const existing = await this.findOne(id);
    if (dto.baseUrl || dto.scheduleCron || dto.allowedDomains) {
      await this.validateConfig({
        baseUrl: dto.baseUrl ?? existing.baseUrl,
        scheduleCron: dto.scheduleCron ?? existing.scheduleCron ?? undefined,
        allowedDomains: dto.allowedDomains ?? existing.allowedDomains,
      });
    }

    const updated = await this.prisma.regulatorySource.update({
      where: { id },
      data: {
        name: dto.name,
        baseUrl: dto.baseUrl,
        adapterType: dto.adapterType,
        scheduleCron: dto.scheduleCron,
        enabled: dto.enabled,
        timeout: dto.timeout,
        retryLimits: dto.retryLimits,
        crawlConcurrency: dto.crawlConcurrency,
        allowedDomains: dto.allowedDomains,
        documentSelectors: dto.documentSelectors || undefined,
      },
    });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'SOURCE_UPDATED',
      entityType: 'RegulatorySource',
      entityId: id,
      details: { ...dto },
    });

    return updated;
  }

  public async delete(id: string, actorEmail?: string) {
    await this.findOne(id);
    await this.prisma.regulatorySource.delete({ where: { id } });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'SOURCE_DELETED',
      entityType: 'RegulatorySource',
      entityId: id,
    });

    return { success: true };
  }

  public async testSource(id: string) {
    const source = await this.findOne(id);

    const isLocalDemoAllowed =
      (source.baseUrl.startsWith('http://localhost:5101') ||
        source.baseUrl.startsWith('http://127.0.0.1:5101') ||
        source.baseUrl.startsWith('http://demo-source:5101')) &&
      (process.env.ALLOW_LOCAL_DEMO_SOURCES === 'true' ||
        Boolean(source.allowedDomains?.includes('localhost:5101')) ||
        Boolean(source.allowedDomains?.includes('127.0.0.1:5101')) ||
        Boolean(source.allowedDomains?.includes('demo-source:5101')));

    const config: ISourceConfig = {
      id: source.id,
      name: source.name,
      baseUrl: source.baseUrl,
      adapterType: source.adapterType,
      allowedDomains: source.allowedDomains,
      documentSelectors: (source.documentSelectors as Record<string, string>) || undefined,
      timeout: source.timeout,
      retryLimits: source.retryLimits,
      crawlConcurrency: source.crawlConcurrency,
      allowLocalhost: isLocalDemoAllowed,
    };

    return await SourceTester.testSource(config);
  }

  public async testAdHocSource(dto: { url: string; adapterType?: string; allowedDomains?: string[] }) {
    const isLocalDemoAllowed =
      (dto.url.startsWith('http://localhost:5101') ||
        dto.url.startsWith('http://127.0.0.1:5101') ||
        dto.url.startsWith('http://demo-source:5101')) &&
      (process.env.ALLOW_LOCAL_DEMO_SOURCES === 'true' ||
        Boolean(dto.allowedDomains?.includes('localhost:5101')) ||
        Boolean(dto.allowedDomains?.includes('127.0.0.1:5101')) ||
        Boolean(dto.allowedDomains?.includes('demo-source:5101')));

    const config: ISourceConfig = {
      id: 'adhoc-test',
      name: 'Ad-hoc Test Source',
      baseUrl: dto.url,
      adapterType: dto.adapterType || 'HTML_LISTING',
      allowedDomains: dto.allowedDomains || [],
      allowLocalhost: isLocalDemoAllowed,
      timeout: 10000,
      retryLimits: 1,
      crawlConcurrency: 1,
    };

    return await SourceTester.testSource(config);
  }

  public async triggerCrawl(id: string, actorEmail?: string) {
    return this.crawlsService.triggerCrawl(id, actorEmail, 'MANUAL_TRIGGER');
  }
}
