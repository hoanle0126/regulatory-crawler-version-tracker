import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { RelationshipType } from '@regtracker/shared';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';

@Injectable()
export class RelationshipsService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(AuditLogsService) private auditLogsService: AuditLogsService
  ) {}

  public async findByDocument(documentId: string) {
    const [outbound, inbound] = await Promise.all([
      this.prisma.documentRelationship.findMany({
        where: { sourceDocumentId: documentId },
        include: { targetDocument: true },
      }),
      this.prisma.documentRelationship.findMany({
        where: { targetDocumentId: documentId },
        include: { sourceDocument: true },
      }),
    ]);

    return {
      documentId,
      outbound,
      inbound,
    };
  }

  public async create(data: {
    sourceDocumentId: string;
    targetDocumentId: string;
    relationshipType: RelationshipType;
    description?: string;
  }, actorEmail?: string) {
    const rel = await this.prisma.documentRelationship.create({
      data: {
        sourceDocumentId: data.sourceDocumentId,
        targetDocumentId: data.targetDocumentId,
        relationshipType: data.relationshipType as any,
        description: data.description,
      },
    });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'DOCUMENT_RELATIONSHIP_CREATED',
      entityType: 'DocumentRelationship',
      entityId: rel.id,
      details: { ...data },
    });

    return rel;
  }

  public async delete(id: string, actorEmail?: string) {
    const rel = await this.prisma.documentRelationship.findUnique({ where: { id } });
    if (!rel) throw new NotFoundException(`Relationship ${id} not found`);

    await this.prisma.documentRelationship.delete({ where: { id } });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'DOCUMENT_RELATIONSHIP_DELETED',
      entityType: 'DocumentRelationship',
      entityId: id,
    });

    return { success: true };
  }
}
