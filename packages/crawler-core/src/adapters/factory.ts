import { SourceAdapterType } from '@regtracker/shared';
import { RegulatorySourceAdapter } from './base.js';
import { HtmlListingAdapter } from './html-listing.js';
import { HtmlArticleAdapter } from './html-article.js';
import { PdfDocumentAdapter } from './pdf-document.js';
import { MockRegulatoryAdapter } from './mock-demo.js';

export class AdapterFactory {
  private static mockAdapterInstance: MockRegulatoryAdapter | null = null;

  public static getMockAdapter(): MockRegulatoryAdapter {
    if (!this.mockAdapterInstance) {
      this.mockAdapterInstance = new MockRegulatoryAdapter();
    }
    return this.mockAdapterInstance;
  }

  public static getAdapter(type: string): RegulatorySourceAdapter {
    switch (type) {
      case SourceAdapterType.HTML_LISTING:
      case 'HTML_LISTING':
        return new HtmlListingAdapter();

      case SourceAdapterType.HTML_ARTICLE:
      case 'HTML_ARTICLE':
        return new HtmlArticleAdapter();

      case SourceAdapterType.PDF_DOCUMENT:
      case 'PDF_DOCUMENT':
        return new PdfDocumentAdapter();

      case SourceAdapterType.MOCK_DEMO:
      case 'MOCK_DEMO':
        return this.getMockAdapter();

      default:
        throw new Error(`Unknown source adapter type: ${type}`);
    }
  }
}
