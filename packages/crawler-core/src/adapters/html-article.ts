import { calculateSha256, normalizeContent, stripHtml } from '@regtracker/legal-parser';
import { IFetchOptions, IFetchResult, SafeFetcher } from '../fetcher.js';
import { DiscoveredDocumentRef, INormalizedDocumentResult, ISourceConfig, RegulatorySourceAdapter } from './base.js';

export class HtmlArticleAdapter implements RegulatorySourceAdapter {
  public async discoverDocuments(config: ISourceConfig): Promise<DiscoveredDocumentRef[]> {
    // Single article/document source: the document URL is the baseUrl itself
    return [
      {
        url: config.baseUrl,
        title: config.name,
      },
    ];
  }

  public async fetchDocument(url: string, options?: IFetchOptions): Promise<IFetchResult> {
    return await SafeFetcher.fetchUrl(url, options);
  }

  public async normalizeDocument(rawSnapshot: IFetchResult): Promise<INormalizedDocumentResult> {
    const text = stripHtml(rawSnapshot.rawContent);
    const normalizedText = normalizeContent(text);
    const normalizedChecksum = calculateSha256(normalizedText);

    return {
      normalizedText,
      normalizedChecksum,
    };
  }
}
