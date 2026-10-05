import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { ILegalNode } from '@regtracker/shared';

@Injectable()
export class VersionsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  public async findOne(id: string) {
    const version = await this.prisma.documentVersion.findUnique({
      where: { id },
      include: {
        document: {
          select: { id: true, title: true, documentNumber: true, status: true },
        },
        rawSnapshot: {
          select: {
            id: true,
            sourceUrl: true,
            finalUrl: true,
            fetchTimestamp: true,
            httpStatus: true,
            contentType: true,
            rawChecksum: true,
            rawContent: true,
          },
        },
      },
    });

    if (!version) throw new NotFoundException(`Version ${id} not found`);
    return version;
  }

  public async getStructure(id: string) {
    await this.findOne(id);

    const nodes = await this.prisma.legalNode.findMany({
      where: { versionId: id },
      orderBy: { orderIndex: 'asc' },
    });

    // Build hierarchical tree for frontend explorer
    const tree: ILegalNode[] = [];
    const nodeMap = new Map<string, ILegalNode>();

    for (const n of nodes) {
      const item: ILegalNode = {
        id: n.id,
        type: n.type as any,
        number: n.number,
        title: n.title,
        content: n.content,
        parentId: n.parentId,
        orderIndex: n.orderIndex,
        hierarchyPath: n.hierarchyPath,
        children: [],
      };
      nodeMap.set(n.id, item);

      if (n.parentId && nodeMap.has(n.parentId)) {
        nodeMap.get(n.parentId)!.children!.push(item);
      } else {
        tree.push(item);
      }
    }

    return {
      versionId: id,
      totalNodes: nodes.length,
      flatNodes: nodes,
      tree,
    };
  }
}
