import { IFetchOptions, IFetchResult } from '../fetcher.js';

export interface DiscoveredDocumentRef {
  url: string;
  title: string;
  documentNumber?: string | null;
  issuingAuthority?: string | null;
  publishedDate?: string | null;
  effectiveDate?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ISourceConfig {
  id?: string;
  name: string;
  baseUrl: string;
  adapterType: string;
  allowedDomains?: string[];
  documentSelectors?: {
    listingContainer?: string;
    itemLink?: string;
    itemTitle?: string;
    itemNumber?: string;
    itemDate?: string;
    contentContainer?: string;
  };
  timeout?: number;
  retryLimits?: number;
  crawlConcurrency?: number;
  customHeaders?: Record<string, string>;
  allowLocalhost?: boolean;
}

export interface INormalizedDocumentResult {
  normalizedText: string;
  normalizedChecksum: string;
}

export interface RegulatorySourceAdapter {
  discoverDocuments(config: ISourceConfig): Promise<DiscoveredDocumentRef[]>;
  fetchDocument(url: string, options?: IFetchOptions): Promise<IFetchResult>;
  normalizeDocument(rawSnapshot: IFetchResult): Promise<INormalizedDocumentResult>;
}
