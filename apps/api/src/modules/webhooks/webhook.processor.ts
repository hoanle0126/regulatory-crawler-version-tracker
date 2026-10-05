import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service.js';

export interface ISendWebhookJob {
  deliveryId: string;
  endpointId: string;
  url: string;
  secret: string;
  payload: Record<string, unknown>;
}

@Processor('webhook-queue')
export class WebhookProcessor extends WorkerHost {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    super();
  }

  async process(job: Job<ISendWebhookJob>): Promise<void> {
    const { deliveryId, url, secret, payload } = job.data;
    const bodyString = JSON.stringify(payload);
    const signature = createHmac('sha256', secret).update(bodyString).digest('hex');

    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery) return;

    const attempts = delivery.attempts + 1;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RegTracker-Webhook-Dispatcher/1.0',
          'X-RegTracker-Signature': `sha256=${signature}`,
          'X-RegTracker-Event': String(payload['eventType'] || ''),
          'X-RegTracker-Delivery': deliveryId,
        },
        body: bodyString,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const responseText = await response.text().catch(() => '');

      if (response.ok) {
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            attempts,
            httpStatus: response.status,
            status: 'SUCCESS',
            responseBody: responseText.slice(0, 1000),
            lastAttemptAt: new Date(),
          },
        });
      } else {
        const nextStatus = attempts >= 3 ? 'FAILED' : 'RETRYING';
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            attempts,
            httpStatus: response.status,
            status: nextStatus,
            responseBody: responseText.slice(0, 1000),
            lastAttemptAt: new Date(),
          },
        });
        if (nextStatus === 'RETRYING') {
          throw new Error(`Webhook target responded with HTTP ${response.status}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const nextStatus = attempts >= 3 ? 'FAILED' : 'RETRYING';

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts,
          status: nextStatus,
          responseBody: `Error: ${msg}`,
          lastAttemptAt: new Date(),
        },
      });

      if (nextStatus === 'RETRYING') {
        throw err;
      }
    }
  }
}
