import * as cheerio from 'cheerio';
import { calculateSha256, normalizeContent, stripHtml } from '@regtracker/legal-parser';
import { IFetchOptions, IFetchResult, SafeFetcher } from '../fetcher.js';
import { DiscoveredDocumentRef, INormalizedDocumentResult, ISourceConfig, RegulatorySourceAdapter } from './base.js';

export class HtmlListingAdapter implements RegulatorySourceAdapter {
  public async discoverDocuments(config: ISourceConfig): Promise<DiscoveredDocumentRef[]> {
    const fetchRes = await this.fetchDocument(config.baseUrl, {
      timeoutMs: config.timeout,
      ssrfOptions: {
        allowLocalhost: config.allowLocalhost,
        allowedHosts: config.allowedDomains,
      },
    });

    const $ = cheerio.load(fetchRes.rawContent);
    const discovered: DiscoveredDocumentRef[] = [];

    const selectors = config.documentSelectors ?? {};
    const itemLinkSelector = selectors.itemLink || 'a[href*="/document"], a[href*="/van-ban"], .doc-item a, article a';
    const container = selectors.listingContainer ? $(selectors.listingContainer) : $('body');

    container.find(itemLinkSelector).each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      if (!href) return;

      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(href, config.baseUrl).toString();
      } catch {
        return;
      }

      const title = selectors.itemTitle
        ? $el.closest('tr, li, .item, article').find(selectors.itemTitle).text().trim() || $el.text().trim()
        : $el.text().trim();

      if (!title) return;

      const itemNumber = selectors.itemNumber
        ? $el.closest('tr, li, .item, article').find(selectors.itemNumber).text().trim()
        : undefined;

      const itemDate = selectors.itemDate
        ? $el.closest('tr, li, .item, article').find(selectors.itemDate).text().trim()
        : undefined;

      discovered.push({
        url: absoluteUrl,
        title,
        documentNumber: itemNumber || null,
        publishedDate: itemDate || null,
      });
    });

    // Deduplicate discovered URLs
    const uniqueMap = new Map<string, DiscoveredDocumentRef>();
    for (const doc of discovered) {
      if (!uniqueMap.has(doc.url)) {
        uniqueMap.set(doc.url, doc);
      }
    }

    return Array.from(uniqueMap.values());
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
