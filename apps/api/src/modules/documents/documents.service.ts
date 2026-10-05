import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { IRagExportDocument } from '@regtracker/shared';

@Injectable()
export class DocumentsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  public async findAll(
    query: PaginationQueryDto,
    filters?: {
      sourceId?: string;
      status?: string;
      documentType?: string;
      issuingAuthority?: string;
    }
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const rawPageSize = query.pageSize !== undefined ? Number(query.pageSize) : 20;
    if (isNaN(rawPageSize) || rawPageSize > 100 || rawPageSize < 1) {
      throw new BadRequestException('pageSize must be an integer between 1 and 100');
    }
    const pageSize = rawPageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.DocumentWhereInput = {};

    if (filters?.sourceId) where.sourceId = filters.sourceId;
    if (filters?.status) where.status = filters.status as any;
    if (filters?.documentType) where.documentType = filters.documentType;
    if (filters?.issuingAuthority) where.issuingAuthority = filters.issuingAuthority;

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { documentNumber: { contains: query.search, mode: 'insensitive' } },
        { canonicalId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          source: { select: { id: true, name: true, baseUrl: true } },
          _count: { select: { versions: true, changeSets: true } },
        },
      }),
      this.prisma.document.count({ where }),
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
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        source: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        changeSets: {
          orderBy: { detectedAt: 'desc' },
        },
        outboundRelations: {
          include: { targetDocument: true },
        },
        inboundRelations: {
          include: { sourceDocument: true },
        },
      },
    });

    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  public async findVersions(id: string) {
    await this.findOne(id);
    return this.prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { versionNumber: 'desc' },
      include: {
        rawSnapshot: {
          select: {
            id: true,
            sourceUrl: true,
            fetchTimestamp: true,
            httpStatus: true,
            contentType: true,
            rawChecksum: true,
          },
        },
        _count: { select: { nodes: true } },
      },
    });
  }

  public async exportRag(id: string, versionId?: string): Promise<IRagExportDocument> {
    const doc = await this.findOne(id);

    let targetVersion;
    if (versionId) {
      targetVersion = await this.prisma.documentVersion.findUnique({
        where: { id: versionId },
        include: { nodes: { orderBy: { orderIndex: 'asc' } } },
      });
    } else {
      targetVersion = await this.prisma.documentVersion.findFirst({
        where: { documentId: id },
        orderBy: { versionNumber: 'desc' },
        include: { nodes: { orderBy: { orderIndex: 'asc' } } },
      });
    }

    if (!targetVersion) {
      throw new NotFoundException(`No version found for document ${id}`);
    }

    return {
      document: {
        id: doc.id,
        canonicalId: doc.canonicalId,
        title: doc.title,
        documentNumber: doc.documentNumber,
        documentType: doc.documentType,
        issuingAuthority: doc.issuingAuthority,
        issuingDate: doc.issuingDate ? doc.issuingDate.toISOString().slice(0, 10) : null,
        publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
        effectiveAt: doc.effectiveAt ? doc.effectiveAt.toISOString().slice(0, 10) : null,
        expiredAt: doc.expiredAt ? doc.expiredAt.toISOString().slice(0, 10) : null,
        status: doc.status as any,
        sourceUrl: doc.sourceUrl,
      },
      version: {
        id: targetVersion.id,
        versionNumber: targetVersion.versionNumber,
        detectedAt: targetVersion.detectedAt.toISOString(),
        rawChecksum: targetVersion.rawChecksum,
        normalizedChecksum: targetVersion.normalizedChecksum,
      },
      nodes: targetVersion.nodes.map((n) => ({
        type: n.type as any,
        number: n.number,
        title: n.title,
        hierarchyPath: n.hierarchyPath,
        content: n.content,
      })),
    };
  }
}
