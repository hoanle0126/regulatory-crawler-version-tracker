import { describe, it, expect } from 'vitest';
import { AdapterFactory } from '../src/adapters/factory.js';
import { SourceAdapterType } from '@regtracker/shared';
import { DEMO_DOC_V1, DEMO_DOC_V2, MockRegulatoryAdapter } from '../src/adapters/mock-demo.js';
import { HtmlListingAdapter } from '../src/adapters/html-listing.js';

describe('Crawler Adapters & Factory', () => {
  it('resolves correct adapter types from factory', () => {
    const mock = AdapterFactory.getAdapter(SourceAdapterType.MOCK_DEMO);
    expect(mock).toBeInstanceOf(MockRegulatoryAdapter);

    const htmlListing = AdapterFactory.getAdapter(SourceAdapterType.HTML_LISTING);
    expect(htmlListing).toBeInstanceOf(HtmlListingAdapter);
  });

  it('MockRegulatoryAdapter discovers and fetches V1 and V2 documents', async () => {
    const adapter = new MockRegulatoryAdapter();
    const discovered = await adapter.discoverDocuments({
      name: 'Demo Source',
      baseUrl: 'https://demo.local',
      adapterType: SourceAdapterType.MOCK_DEMO,
    });

    expect(discovered.length).toBe(1);
    expect(discovered[0]?.title).toContain('Thông tư DEMO');

    // Fetch V1
    adapter.setVersion(1);
    const v1Res = await adapter.fetchDocument(discovered[0]!.url);
    expect(v1Res.rawContent).toContain('1. Hồ sơ gồm giấy A.');
    expect(v1Res.rawContent).toContain('2. Thời hạn xử lý là 10 ngày.');
    expect(v1Res.rawContent).toContain('Doanh nghiệp nộp hồ sơ trực tiếp.');

    const norm1 = await adapter.normalizeDocument(v1Res);
    expect(norm1.normalizedChecksum.length).toBe(64);

    // Fetch V2
    adapter.setVersion(2);
    const v2Res = await adapter.fetchDocument(discovered[0]!.url);
    expect(v2Res.rawContent).toContain('1. Hồ sơ gồm giấy A và giấy B.');
    expect(v2Res.rawContent).toContain('2. Thời hạn xử lý là 5 ngày.');
    expect(v2Res.rawContent).toContain('3. Doanh nghiệp phải lưu hồ sơ trong 3 năm.');
    expect(v2Res.rawContent).toContain('Doanh nghiệp có thể nộp hồ sơ điện tử.');

    const norm2 = await adapter.normalizeDocument(v2Res);
    expect(norm2.normalizedChecksum).not.toBe(norm1.normalizedChecksum);
  });
});
