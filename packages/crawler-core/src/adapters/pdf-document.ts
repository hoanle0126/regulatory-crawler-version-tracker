import pdfParse from 'pdf-parse';
import { calculateSha256, normalizeContent } from '@regtracker/legal-parser';
import { IFetchOptions, IFetchResult, SafeFetcher } from '../fetcher.js';
import { DiscoveredDocumentRef, INormalizedDocumentResult, ISourceConfig, RegulatorySourceAdapter } from './base.js';

export class PdfDocumentAdapter implements RegulatorySourceAdapter {
  public async discoverDocuments(config: ISourceConfig): Promise<DiscoveredDocumentRef[]> {
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
    if (!rawSnapshot.rawBuffer || rawSnapshot.rawBuffer.length === 0) {
      throw new Error('PDF snapshot has empty buffer');
    }

    // Check magic bytes for PDF: %PDF- (0x25 0x50 0x44 0x46 0x2d)
    const magic = rawSnapshot.rawBuffer.subarray(0, 5).toString('ascii');
    if (magic !== '%PDF-') {
      throw new Error(`Invalid PDF header: expected "%PDF-", got "${magic}"`);
    }

    try {
      const data = await pdfParse(rawSnapshot.rawBuffer);
      const text = data.text || '';
      const normalizedText = normalizeContent(text);
      const normalizedChecksum = calculateSha256(normalizedText);

      return {
        normalizedText,
        normalizedChecksum,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse PDF document text: ${msg}`);
    }
  }
}
