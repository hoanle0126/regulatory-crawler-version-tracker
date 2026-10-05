import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { AdapterFactory, ISourceConfig } from '@regtracker/crawler-core';
import { calculateSha256, VietnameseLegalParser } from '@regtracker/legal-parser';
import { LegalDiffEngine } from '@regtracker/diff-engine';
import { CrawlRunStatus, DocumentStatus, WebhookEvent } from '@regtracker/shared';
import { WebhooksService } from '../webhooks/webhooks.service.js';

export interface ICrawlJobData {
  crawlRunId: string;
  sourceId: string;
}

@Processor('crawl-queue')
export class CrawlProcessor extends WorkerHost {
  private parser = new VietnameseLegalParser();
  private diffEngine = new LegalDiffEngine();

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(WebhooksService) private webhooksService: WebhooksService
  ) {
    super();
  }

  async process(job: Job<ICrawlJobData>): Promise<void> {
    const { crawlRunId, sourceId } = job.data;

    const source = await this.prisma.regulatorySource.findUnique({
      where: { id: sourceId },
    });
    if (!source) {
      throw new Error(`RegulatorySource ${sourceId} not found`);
    }

    // Update crawl run status to RUNNING
    await this.prisma.crawlRun.update({
      where: { id: crawlRunId },
      data: { status: CrawlRunStatus.RUNNING },
    });

    const isLocalDemoAllowed =
      process.env.ALLOW_LOCAL_DEMO_SOURCES === 'true' ||
      source.allowedDomains.includes('localhost:5101') ||
      source.allowedDomains.includes('127.0.0.1:5101');

    const sourceConfig: ISourceConfig = {
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

    let totalDiscovered = 0;
    let totalNew = 0;
    let totalChanged = 0;
    let totalFailed = 0;

    try {
      // 1. Resolve Adapter
      const adapter = AdapterFactory.getAdapter(source.adapterType);

      // 2. Discover Documents
      const discoveredDocs = await adapter.discoverDocuments(sourceConfig);
      totalDiscovered = discoveredDocs.length;

      // 3. Process Each Discovered Document
      for (const docRef of discoveredDocs) {
        try {
          // Fetch raw document safely
          const fetchResult = await adapter.fetchDocument(docRef.url, {
            timeoutMs: source.timeout,
            ssrfOptions: {
              allowLocalhost: isLocalDemoAllowed,
              allowedHosts: source.allowedDomains,
            },
          });

          // Store Raw Snapshot
          const snapshot = await this.prisma.rawSnapshot.create({
            data: {
              sourceId: source.id,
              sourceUrl: fetchResult.sourceUrl,
              finalUrl: fetchResult.finalUrl,
              fetchTimestamp: new Date(fetchResult.fetchTimestamp),
              httpStatus: fetchResult.httpStatus,
              contentType: fetchResult.contentType,
              headers: fetchResult.headers,
              rawChecksum: fetchResult.rawChecksum,
              rawContent: fetchResult.rawContent,
              parserVersion: '1.0.0',
              adapterVersion: '1.0.0',
            },
          });

          // Normalize Content
          const { normalizedText, normalizedChecksum } = await adapter.normalizeDocument(fetchResult);

          // Parse Structure and Metadata
          const parsedDoc = this.parser.parse(normalizedText);

          // Document Canonical Identity:
          // Prefer document number (e.g. 01/2026/TT-DEMO), fallback to canonical URL hash
          const docNumber = parsedDoc.documentNumber || docRef.documentNumber;
          const canonicalId = docNumber
            ? `doc:${docNumber.replace(/[\/\s]/g, '-').toLowerCase()}`
            : `url:${calculateSha256(docRef.url).slice(0, 16)}`;

          const title = parsedDoc.title || docRef.title || 'Văn bản quy phạm pháp luật';
          const authority = parsedDoc.issuingAuthority || docRef.issuingAuthority;
          const effectiveDate = parsedDoc.effectiveAt ? new Date(parsedDoc.effectiveAt) : undefined;
          const issuingDate = parsedDoc.issuingDate ? new Date(parsedDoc.issuingDate) : undefined;

          // Find or create Document in a transaction
          const { isNewDoc, isNewVersion, document, version, changeSet } = await this.prisma.$transaction(
            async (tx) => {
              let doc = await tx.document.findUnique({
                where: { canonicalId },
                include: {
                  versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                    include: { nodes: true },
                  },
                },
              });

              let isNew = false;
              if (!doc) {
                doc = await tx.document.create({
                  data: {
                    canonicalId,
                    title,
                    documentNumber: docNumber,
                    documentType: title.split(' ')[0] || 'Văn bản',
                    issuingAuthority: authority,
                    issuingDate,
                    effectiveAt: effectiveDate,
                    status: DocumentStatus.EFFECTIVE,
                    sourceUrl: docRef.url,
                    sourceId: source.id,
                  },
                  include: {
                    versions: {
                      orderBy: { versionNumber: 'desc' },
                      take: 1,
                      include: { nodes: true },
                    },
                  },
                });
                isNew = true;
              }

              const latestVersion = doc.versions[0];

              // Idempotency & No-change rule:
              // If normalized checksum is identical to latest stored version -> DO NOT CREATE NEW SUBSTANTIVE VERSION!
              if (latestVersion && latestVersion.normalizedChecksum === normalizedChecksum) {
                return {
                  isNewDoc: false,
                  isNewVersion: false,
                  document: doc,
                  version: latestVersion,
                  changeSet: null,
                };
              }

              const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

              // Create DocumentVersion
              const newVersion = await tx.documentVersion.create({
                data: {
                  documentId: doc.id,
                  versionNumber: nextVersionNumber,
                  rawSnapshotId: snapshot.id,
                  rawChecksum: fetchResult.rawChecksum,
                  normalizedChecksum,
                  normalizedText,
                  detectedAt: new Date(),
                  effectiveFrom: effectiveDate,
                  parserVersion: '1.0.0',
                },
              });

              // Create LegalNodes
              for (const node of parsedDoc.nodes) {
                await tx.legalNode.create({
                  data: {
                    versionId: newVersion.id,
                    type: node.type,
                    number: node.number,
                    title: node.title,
                    content: node.content,
                    orderIndex: node.orderIndex,
                    hierarchyPath: node.hierarchyPath,
                  },
                });
              }

              // Update latestVersionId on Document
              await tx.document.update({
                where: { id: doc.id },
                data: {
                  latestVersionId: newVersion.id,
                  title,
                  documentNumber: docNumber || doc.documentNumber,
                  effectiveAt: effectiveDate || doc.effectiveAt,
                },
              });

              // Structural Diff against previous version
              let createdChangeSet: any = null;
              if (latestVersion) {
                const diffResult = this.diffEngine.compare(latestVersion.nodes as any, parsedDoc.nodes);
                if (diffResult.hasChanges) {
                  createdChangeSet = await tx.changeSet.create({
                    data: {
                      documentId: doc.id,
                      previousVersionId: latestVersion.id,
                      newVersionId: newVersion.id,
                      summary: diffResult.summary.textSummary,
                      status: 'DETECTED',
                    },
                  });

                  for (const change of diffResult.changes) {
                    await tx.changeItem.create({
                      data: {
                        changeSetId: createdChangeSet.id,
                        nodeType: change.nodeType,
                        hierarchyPath: change.hierarchyPath,
                        changeType: change.changeType,
                        oldContent: change.oldContent,
                        newContent: change.newContent,
                        oldNodeId: change.oldNodeId,
                        newNodeId: change.newNodeId,
                        similarityScore: change.similarityScore,
                        diffFragments: change.diffFragments as any,
                        metadata: (change.metadata as any) || undefined,
                      },
                    });
                  }
                }
              }

              return {
                isNewDoc: isNew,
                isNewVersion: true,
                document: doc,
                version: newVersion,
                changeSet: createdChangeSet,
              };
            }
          );

          if (isNewDoc) {
            totalNew++;
            await this.webhooksService.dispatchDocumentEvent(
              WebhookEvent.DOCUMENT_CREATED,
              document.id,
              version.id,
              null,
              `New regulatory document created: ${document.title}`,
              { title: document.title, documentNumber: document.documentNumber }
            );
          } else if (isNewVersion) {
            if (changeSet) {
              totalChanged++;
              await this.webhooksService.dispatchDocumentEvent(
                WebhookEvent.DOCUMENT_CHANGED,
                document.id,
                version.id,
                changeSet.id,
                changeSet.summary,
                { title: document.title, versionNumber: version.versionNumber }
              );
            } else {
              totalNew++;
              await this.webhooksService.dispatchDocumentEvent(
                WebhookEvent.DOCUMENT_VERSION_CREATED,
                document.id,
                version.id,
                null,
                `Version ${version.versionNumber} created for ${document.title}`,
                { title: document.title, versionNumber: version.versionNumber }
              );
            }
          }
        } catch (itemErr: unknown) {
          totalFailed++;
          console.error(`Failed to process document ${docRef.url}:`, itemErr);
        }
      }

      // Mark crawl run as COMPLETED
      await this.prisma.crawlRun.update({
        where: { id: crawlRunId },
        data: {
          status: CrawlRunStatus.COMPLETED,
          completedAt: new Date(),
          totalDiscovered,
          totalNew,
          totalChanged,
          totalFailed,
        },
      });

      // Update Source status
      await this.prisma.regulatorySource.update({
        where: { id: source.id },
        data: {
          lastCrawlAt: new Date(),
          lastCrawlStatus: 'SUCCESS',
        },
      });
    } catch (crawlErr: unknown) {
      const msg = crawlErr instanceof Error ? crawlErr.message : String(crawlErr);
      await this.prisma.crawlRun.update({
        where: { id: crawlRunId },
        data: {
          status: CrawlRunStatus.FAILED,
          completedAt: new Date(),
          errorDetails: msg,
          totalDiscovered,
          totalNew,
          totalChanged,
          totalFailed,
        },
      });

      await this.prisma.regulatorySource.update({
        where: { id: source.id },
        data: {
          lastCrawlAt: new Date(),
          lastCrawlStatus: 'FAILED',
        },
      });

      throw crawlErr;
    }
  }
}
