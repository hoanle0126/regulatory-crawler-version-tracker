import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { LegalDiffEngine } from '@regtracker/diff-engine';
import { ILegalNode } from '@regtracker/shared';

@Injectable()
export class DiffService {
  private diffEngine = new LegalDiffEngine();

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  public async compareVersions(documentId: string, fromVersionId: string, toVersionId: string) {
    if (fromVersionId === toVersionId) {
      throw new BadRequestException('Cannot compare a version with itself. Please select two distinct versions.');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, title: true, documentNumber: true, status: true, canonicalId: true },
    });
    if (!document) throw new NotFoundException(`Document ${documentId} not found`);

    const [verA, verB] = await Promise.all([
      this.prisma.documentVersion.findUnique({
        where: { id: fromVersionId },
        include: { nodes: { orderBy: { orderIndex: 'asc' } } },
      }),
      this.prisma.documentVersion.findUnique({
        where: { id: toVersionId },
        include: { nodes: { orderBy: { orderIndex: 'asc' } } },
      }),
    ]);

    if (!verA) throw new NotFoundException(`From version ${fromVersionId} not found`);
    if (!verB) throw new NotFoundException(`To version ${toVersionId} not found`);

    // Check if a persisted ChangeSet exists for this direct transition
    const persistedChangeSet = await this.prisma.changeSet.findUnique({
      where: {
        previousVersionId_newVersionId: {
          previousVersionId: fromVersionId,
          newVersionId: toVersionId,
        },
      },
      include: {
        items: {
          orderBy: { hierarchyPath: 'asc' },
        },
      },
    });

    if (persistedChangeSet) {
      return {
        document,
        fromVersion: {
          id: verA.id,
          versionNumber: verA.versionNumber,
          detectedAt: verA.detectedAt,
          rawChecksum: verA.rawChecksum,
          normalizedChecksum: verA.normalizedChecksum,
        },
        toVersion: {
          id: verB.id,
          versionNumber: verB.versionNumber,
          detectedAt: verB.detectedAt,
          rawChecksum: verB.rawChecksum,
          normalizedChecksum: verB.normalizedChecksum,
        },
        changeSetId: persistedChangeSet.id,
        status: persistedChangeSet.status,
        hasChanges: persistedChangeSet.items.length > 0,
        summary: {
          textSummary: persistedChangeSet.summary,
          totalChanges: persistedChangeSet.items.length,
          addedCount: persistedChangeSet.items.filter((i) => i.changeType === 'ADDED').length,
          modifiedCount: persistedChangeSet.items.filter((i) => i.changeType === 'MODIFIED').length,
          removedCount: persistedChangeSet.items.filter((i) => i.changeType === 'REMOVED').length,
          affectedArticles: Array.from(
            new Set(
              persistedChangeSet.items
                .map((i) => i.hierarchyPath.match(/Điều\s+\d+/i)?.[0])
                .filter(Boolean) as string[]
            )
          ),
        },
        changes: persistedChangeSet.items.map((item) => ({
          id: item.id,
          nodeType: item.nodeType,
          hierarchyPath: item.hierarchyPath,
          changeType: item.changeType,
          oldContent: item.oldContent,
          newContent: item.newContent,
          oldNodeId: item.oldNodeId,
          newNodeId: item.newNodeId,
          similarityScore: item.similarityScore,
          diffFragments: item.diffFragments,
          metadata: item.metadata,
        })),
      };
    }

    // Otherwise compute on-the-fly comparison
    const nodesA: ILegalNode[] = verA.nodes.map((n) => ({
      id: n.id,
      type: n.type as any,
      number: n.number,
      title: n.title,
      content: n.content,
      parentId: n.parentId,
      orderIndex: n.orderIndex,
      hierarchyPath: n.hierarchyPath,
    }));

    const nodesB: ILegalNode[] = verB.nodes.map((n) => ({
      id: n.id,
      type: n.type as any,
      number: n.number,
      title: n.title,
      content: n.content,
      parentId: n.parentId,
      orderIndex: n.orderIndex,
      hierarchyPath: n.hierarchyPath,
    }));

    const diffResult = this.diffEngine.compare(nodesA, nodesB);

    return {
      document,
      fromVersion: {
        id: verA.id,
        versionNumber: verA.versionNumber,
        detectedAt: verA.detectedAt,
        rawChecksum: verA.rawChecksum,
        normalizedChecksum: verA.normalizedChecksum,
      },
      toVersion: {
        id: verB.id,
        versionNumber: verB.versionNumber,
        detectedAt: verB.detectedAt,
        rawChecksum: verB.rawChecksum,
        normalizedChecksum: verB.normalizedChecksum,
      },
      changeSetId: null,
      status: 'CALCULATED',
      hasChanges: diffResult.hasChanges,
      summary: diffResult.summary,
      changes: diffResult.changes,
    };
  }
}
