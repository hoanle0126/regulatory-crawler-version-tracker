import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { WebhookEvent } from '@regtracker/shared';

describe('Webhook HMAC Signatures & Payload Security (Prompt Section 33 & 55)', () => {
  const secret = 'super-secret-webhook-key-2026';

  function generateSignature(payload: any, key: string): string {
    return createHmac('sha256', key).update(JSON.stringify(payload)).digest('hex');
  }

  function verifySignature(payload: any, signature: string, key: string): boolean {
    const expected = generateSignature(payload, key);
    return expected === signature;
  }

  it('generates reproducible HMAC SHA-256 signatures', () => {
    const payload = {
      eventId: 'evt-123',
      eventType: WebhookEvent.DOCUMENT_CHANGED,
      documentId: 'doc-001',
      versionId: 'ver-002',
      changeSetId: 'cs-001',
      summary: 'Version introduces: 2 modified clauses, 1 new clause.',
      timestamp: '2026-10-05T10:00:00.000Z',
      data: { number: '01/2026/TT-DEMO' },
    };

    const sig1 = generateSignature(payload, secret);
    const sig2 = generateSignature(payload, secret);

    expect(sig1).toBe(sig2);
    expect(sig1.length).toBe(64);
    expect(verifySignature(payload, sig1, secret)).toBe(true);
  });

  it('rejects tampered payloads with invalid signatures', () => {
    const payload = {
      eventId: 'evt-123',
      eventType: WebhookEvent.DOCUMENT_CHANGED,
      documentId: 'doc-001',
      timestamp: '2026-10-05T10:00:00.000Z',
      data: { amount: 100 },
    };

    const signature = generateSignature(payload, secret);

    const tamperedPayload = {
      ...payload,
      data: { amount: 999999 }, // Attacker modified data
    };

    expect(verifySignature(tamperedPayload, signature, secret)).toBe(false);
  });

  it('rejects signatures generated with the wrong secret', () => {
    const payload = { eventId: 'evt-456' };
    const wrongKeySignature = generateSignature(payload, 'wrong-secret');

    expect(verifySignature(payload, wrongKeySignature, secret)).toBe(false);
  });
});
