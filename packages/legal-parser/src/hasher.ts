import { createHash } from 'node:crypto';

/**
 * Computes a standard SHA-256 hex digest for a string or buffer.
 */
export function calculateSha256(content: string | Buffer): string {
  const hash = createHash('sha256');
  hash.update(content);
  return hash.digest('hex');
}
