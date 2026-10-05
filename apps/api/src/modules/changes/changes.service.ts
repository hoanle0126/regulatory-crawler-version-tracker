import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { ChangeSetStatus } from '@regtracker/shared';

@Injectable()
export class ChangesService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(AuditLogsService) private auditLogsService: AuditLogsService
  ) {}

  public async findAll(query: PaginationQueryDto, status?: string, documentId?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ChangeSetWhereInput = {};
    if (status) where.status = status as any;
    if (documentId) where.documentId = documentId;

    if (query.search) {
      where.OR = [
        { summary: { contains: query.search, mode: 'insensitive' } },
        { document: { title: { contains: query.search, mode: 'insensitive' } } },
        { document: { documentNumber: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.changeSet.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { detectedAt: 'desc' },
        include: {
          document: {
            select: { id: true, title: true, documentNumber: true, status: true },
          },
          previousVersion: {
            select: { id: true, versionNumber: true, detectedAt: true },
          },
          newVersion: {
            select: { id: true, versionNumber: true, detectedAt: true },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.changeSet.count({ where }),
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
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { id },
      include: {
        document: true,
        previousVersion: true,
        newVersion: true,
        items: {
          orderBy: { hierarchyPath: 'asc' },
        },
      },
    });

    if (!changeSet) throw new NotFoundException(`ChangeSet ${id} not found`);
    return changeSet;
  }

  public async updateStatus(id: string, status: string, actorEmail?: string) {
    await this.findOne(id);

    const validStatuses = Object.values(ChangeSetStatus);
    if (!validStatuses.includes(status as ChangeSetStatus)) {
      throw new BadRequestException(`Invalid status. Allowed values: ${validStatuses.join(', ')}`);
    }

    const updated = await this.prisma.changeSet.update({
      where: { id },
      data: {
        status: status as any,
        reviewedBy: actorEmail,
        reviewedAt: new Date(),
      },
    });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'CHANGESET_STATUS_UPDATED',
      entityType: 'ChangeSet',
      entityId: id,
      details: { previousStatus: updated.status, newStatus: status },
    });

    return updated;
  }
}
