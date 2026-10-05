import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class AuditLogsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  public async logAction(params: {
    actorId?: string;
    actorEmail?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    // Sanitize details to guarantee secrets/passwords are never logged
    let sanitizedDetails: Prisma.InputJsonValue | undefined = undefined;
    if (params.details) {
      const clean = { ...params.details };
      delete clean.password;
      delete clean.passwordHash;
      delete clean.token;
      delete clean.secret;
      delete clean.apiKey;
      sanitizedDetails = clean as Prisma.InputJsonValue;
    }

    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorEmail: params.actorEmail,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: sanitizedDetails,
          ipAddress: params.ipAddress,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
      return null;
    }
  }

  public async findAll(query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { entityType: { contains: query.search, mode: 'insensitive' } },
        { actorEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
