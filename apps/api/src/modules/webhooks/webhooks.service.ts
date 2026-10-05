import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service.js';
import { IWebhookPayload, WebhookEvent } from '@regtracker/shared';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @InjectQueue('webhook-queue') private webhookQueue: Queue,
    @Inject(AuditLogsService) private auditLogsService: AuditLogsService
  ) {}

  public async findAll() {
    return this.prisma.webhookEndpoint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    });
  }

  public async findOne(id: string) {
    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!endpoint) throw new NotFoundException(`Webhook endpoint ${id} not found`);
    return endpoint;
  }

  public async create(data: {
    url: string;
    description?: string;
    events: string[];
    secret?: string;
  }, actorEmail?: string) {
    const secret = data.secret || randomBytes(24).toString('hex');
    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        url: data.url,
        description: data.description,
        events: data.events,
        secret,
        enabled: true,
      },
    });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'WEBHOOK_ENDPOINT_CREATED',
      entityType: 'WebhookEndpoint',
      entityId: endpoint.id,
      details: { url: endpoint.url, events: endpoint.events },
    });

    return endpoint;
  }

  public async update(id: string, data: {
    url?: string;
    description?: string;
    events?: string[];
    enabled?: boolean;
  }, actorEmail?: string) {
    await this.findOne(id);
    const updated = await this.prisma.webhookEndpoint.update({
      where: { id },
      data,
    });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'WEBHOOK_ENDPOINT_UPDATED',
      entityType: 'WebhookEndpoint',
      entityId: id,
      details: { ...data },
    });

    return updated;
  }

  public async rotateSecret(id: string, actorEmail?: string) {
    await this.findOne(id);
    const newSecret = randomBytes(24).toString('hex');
    const updated = await this.prisma.webhookEndpoint.update({
      where: { id },
      data: { secret: newSecret },
    });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'WEBHOOK_SECRET_ROTATED',
      entityType: 'WebhookEndpoint',
      entityId: id,
    });

    return updated;
  }

  public async delete(id: string, actorEmail?: string) {
    await this.findOne(id);
    await this.prisma.webhookEndpoint.delete({ where: { id } });

    await this.auditLogsService.logAction({
      actorEmail,
      action: 'WEBHOOK_ENDPOINT_DELETED',
      entityType: 'WebhookEndpoint',
      entityId: id,
    });

    return { success: true };
  }

  public async dispatchDocumentEvent(
    eventType: WebhookEvent,
    documentId: string,
    versionId?: string | null,
    changeSetId?: string | null,
    summary?: string | null,
    additionalData: Record<string, unknown> = {}
  ) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { enabled: true },
    });

    const matchingEndpoints = endpoints.filter(
      (ep) => ep.events.length === 0 || ep.events.includes(eventType)
    );

    const payload: IWebhookPayload = {
      eventId: randomBytes(16).toString('hex'),
      eventType,
      timestamp: new Date().toISOString(),
      documentId,
      versionId: versionId || null,
      changeSetId: changeSetId || null,
      summary: summary || null,
      data: additionalData,
    };

    for (const ep of matchingEndpoints) {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          endpointId: ep.id,
          eventType,
          payload: payload as any,
          status: 'PENDING',
        },
      });

      await this.webhookQueue.add('send-webhook', {
        deliveryId: delivery.id,
        endpointId: ep.id,
        url: ep.url,
        secret: ep.secret,
        payload,
      });
    }
  }

  public async sendTestPing(endpointId: string) {
    const ep = await this.findOne(endpointId);
    const payload: IWebhookPayload = {
      eventId: randomBytes(16).toString('hex'),
      eventType: WebhookEvent.DOCUMENT_CHANGED,
      timestamp: new Date().toISOString(),
      documentId: 'test-doc-id',
      versionId: 'test-version-id',
      changeSetId: 'test-changeset-id',
      summary: 'Test webhook event triggered from RegTracker Admin Console',
      data: { isTest: true },
    };

    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        endpointId: ep.id,
        eventType: 'test.ping',
        payload: payload as any,
        status: 'PENDING',
      },
    });

    await this.webhookQueue.add('send-webhook', {
      deliveryId: delivery.id,
      endpointId: ep.id,
      url: ep.url,
      secret: ep.secret,
      payload,
    });

    return { deliveryId: delivery.id, status: 'QUEUED' };
  }
}
