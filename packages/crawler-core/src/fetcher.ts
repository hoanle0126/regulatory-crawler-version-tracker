import { calculateSha256 } from '@regtracker/legal-parser';
import { ISsrfValidationOptions, SsrfGuard } from './security/ssrf-guard.js';

export interface IFetchOptions {
  timeoutMs?: number;
  maxRedirects?: number;
  maxResponseSizeBytes?: number;
  userAgent?: string;
  etag?: string;
  lastModified?: string;
  ssrfOptions?: ISsrfValidationOptions;
  retries?: number;
  retryDelayMs?: number;
}

export interface IFetchResult {
  sourceUrl: string;
  finalUrl: string;
  fetchTimestamp: string;
  httpStatus: number;
  contentType: string;
  headers: Record<string, string>;
  rawContent: string;
  rawBuffer?: Buffer;
  rawChecksum: string;
  isNotModified: boolean;
}

export class SafeFetcher {
  private static readonly DEFAULT_USER_AGENT =
    'RegTracker-Bot/1.0 (+https://regtracker.local/bot; compliance-monitoring)';
  private static readonly DEFAULT_TIMEOUT_MS = 15000;
  private static readonly DEFAULT_MAX_REDIRECTS = 5;
  private static readonly DEFAULT_MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10 MB

  /**
   * Fetches an external URL safely with SSRF protection, size caps, and redirect validation.
   */
  public static async fetchUrl(urlString: string, options: IFetchOptions = {}): Promise<IFetchResult> {
    const timeoutMs = options.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;
    const maxRedirects = options.maxRedirects ?? this.DEFAULT_MAX_REDIRECTS;
    const maxResponseSize = options.maxResponseSizeBytes ?? this.DEFAULT_MAX_RESPONSE_SIZE;
    const userAgent = options.userAgent ?? this.DEFAULT_USER_AGENT;
    const maxRetries = options.retries ?? 2;
    const retryDelay = options.retryDelayMs ?? 1000;

    let attempt = 0;
    while (true) {
      try {
        return await this.executeFetch(urlString, {
          timeoutMs,
          maxRedirects,
          maxResponseSize,
          userAgent,
          etag: options.etag,
          lastModified: options.lastModified,
          ssrfOptions: options.ssrfOptions,
        });
      } catch (err: unknown) {
        attempt++;
        const isTransient = this.isTransientError(err);
        if (attempt <= maxRetries && isTransient) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
  }

  private static async executeFetch(
    initialUrl: string,
    config: {
      timeoutMs: number;
      maxRedirects: number;
      maxResponseSize: number;
      userAgent: string;
      etag?: string;
      lastModified?: string;
      ssrfOptions?: ISsrfValidationOptions;
    }
  ): Promise<IFetchResult> {
    let currentUrl = initialUrl;
    let redirectCount = 0;

    while (redirectCount <= config.maxRedirects) {
      // 1. SSRF Validation for current URL (including every redirect destination!)
      const ssrfCheck = await SsrfGuard.validateUrl(currentUrl, config.ssrfOptions);
      if (!ssrfCheck.safe) {
        throw new Error(`SSRF blocked for ${currentUrl}: ${ssrfCheck.reason}`);
      }

      // 2. Setup request headers
      const headers: Record<string, string> = {
        'User-Agent': config.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7',
      };
      if (config.etag) headers['If-None-Match'] = config.etag;
      if (config.lastModified) headers['If-Modified-Since'] = config.lastModified;

      // 3. Setup timeout controller
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          headers,
          redirect: 'manual', // Never follow redirects automatically
          signal: controller.signal,
        });

        // Check for 304 Not Modified
        if (response.status === 304) {
          return {
            sourceUrl: initialUrl,
            finalUrl: currentUrl,
            fetchTimestamp: new Date().toISOString(),
            httpStatus: 304,
            contentType: response.headers.get('content-type') || 'text/html',
            headers: Object.fromEntries(response.headers.entries()),
            rawContent: '',
            rawChecksum: '',
            isNotModified: true,
          };
        }

        // Check for redirects (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get('location');
          if (!location) {
            throw new Error(`Redirect HTTP ${response.status} missing Location header`);
          }

          // Resolve relative redirect against current URL
          const resolvedLocation = new URL(location, currentUrl).toString();
          redirectCount++;

          if (redirectCount > config.maxRedirects) {
            throw new Error(`Exceeded maximum redirect limit of ${config.maxRedirects}`);
          }

          currentUrl = resolvedLocation;
          continue;
        }

        // Check response size from Content-Length header before reading body
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > config.maxResponseSize) {
          throw new Error(
            `Response content-length (${contentLength} bytes) exceeds limit of ${config.maxResponseSize} bytes`
          );
        }

        // Read response body with streaming size enforcement
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > config.maxResponseSize) {
          throw new Error(
            `Response size (${arrayBuffer.byteLength} bytes) exceeds limit of ${config.maxResponseSize} bytes`
          );
        }

        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'text/plain';
        const rawContent = buffer.toString('utf-8');
        const rawChecksum = calculateSha256(buffer);

        return {
          sourceUrl: initialUrl,
          finalUrl: currentUrl,
          fetchTimestamp: new Date().toISOString(),
          httpStatus: response.status,
          contentType,
          headers: Object.fromEntries(response.headers.entries()),
          rawContent,
          rawBuffer: buffer,
          rawChecksum,
          isNotModified: false,
        };
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error(`Exceeded maximum redirect limit of ${config.maxRedirects}`);
  }

  private static isTransientError(err: unknown): boolean {
    if (!err) return false;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('SSRF blocked') || msg.includes('exceeds limit')) {
      return false;
    }
    return (
      msg.includes('timeout') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('abort')
    );
  }
}
