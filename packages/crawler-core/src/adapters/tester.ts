import { IFetchResult, SafeFetcher } from '../fetcher.js';
import { ISourceConfig } from './base.js';
import { AdapterFactory } from './factory.js';

export interface ISourceTestResult {
  reachable: boolean;
  status: 'REACHABLE' | 'BLOCKED' | 'TIMEOUT' | 'UNSAFE_URL' | 'UNSUPPORTED_CONTENT' | 'ERROR';
  httpStatus?: number;
  contentType?: string;
  detectedType: 'HTML' | 'PDF' | 'JSON' | 'UNKNOWN';
  adapterCompatible: boolean;
  discoveredCount?: number;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

export class SourceTester {
  public static async testSource(config: ISourceConfig): Promise<ISourceTestResult> {
    try {
      // 1. Fetch source root URL safely
      let fetchResult: IFetchResult;
      try {
        fetchResult = await SafeFetcher.fetchUrl(config.baseUrl, {
          timeoutMs: config.timeout || 10000,
          ssrfOptions: {
            allowLocalhost: config.allowLocalhost,
            allowedHosts: config.allowedDomains,
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('SSRF blocked') || msg.includes('SSRF') || msg.includes('security policy')) {
          return {
            reachable: false,
            status: 'UNSAFE_URL',
            detectedType: 'UNKNOWN',
            adapterCompatible: false,
            message: `URL rejected by SSRF guard: ${msg}`,
            error: msg,
          };
        }
        if (msg.includes('timeout') || msg.includes('abort')) {
          return {
            reachable: false,
            status: 'TIMEOUT',
            detectedType: 'UNKNOWN',
            adapterCompatible: false,
            message: `Connection timed out after ${config.timeout || 10000}ms`,
            error: msg,
          };
        }
        return {
          reachable: false,
          status: 'ERROR',
          detectedType: 'UNKNOWN',
          adapterCompatible: false,
          message: `Network error: ${msg}`,
          error: msg,
        };
      }

      // Check HTTP status code
      if ([401, 403].includes(fetchResult.httpStatus)) {
        return {
          reachable: true,
          status: 'BLOCKED',
          httpStatus: fetchResult.httpStatus,
          contentType: fetchResult.contentType,
          detectedType: 'UNKNOWN',
          adapterCompatible: false,
          message: `Source returned HTTP ${fetchResult.httpStatus} (Access Blocked / Authentication Required)`,
        };
      }

      // Detect type
      const ct = fetchResult.contentType.toLowerCase();
      let detectedType: 'HTML' | 'PDF' | 'JSON' | 'UNKNOWN' = 'UNKNOWN';
      if (ct.includes('html')) detectedType = 'HTML';
      else if (ct.includes('pdf')) detectedType = 'PDF';
      else if (ct.includes('json')) detectedType = 'JSON';

      // Test adapter compatibility
      const adapter = AdapterFactory.getAdapter(config.adapterType);
      let discoveredCount = 0;
      let adapterCompatible = true;
      let warningMessage = '';

      try {
        const discovered = await adapter.discoverDocuments(config);
        discoveredCount = discovered.length;
      } catch (err: unknown) {
        adapterCompatible = false;
        warningMessage = ` Adapter warning: ${err instanceof Error ? err.message : String(err)}`;
      }

      return {
        reachable: true,
        status: 'REACHABLE',
        httpStatus: fetchResult.httpStatus,
        contentType: fetchResult.contentType,
        detectedType,
        adapterCompatible,
        discoveredCount,
        message: `Successfully connected. Discovered ${discoveredCount} potential document(s).${warningMessage}`,
      };
    } catch (err: unknown) {
      return {
        reachable: false,
        status: 'ERROR',
        detectedType: 'UNKNOWN',
        adapterCompatible: false,
        message: `Testing failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
