import { calculateSha256, normalizeContent } from '@regtracker/legal-parser';
import { IFetchOptions, IFetchResult } from '../fetcher.js';
import { DiscoveredDocumentRef, INormalizedDocumentResult, ISourceConfig, RegulatorySourceAdapter } from './base.js';

export const DEMO_DOC_V1 = `
[SYNTHETIC DEMO DATA - NOT REAL LAW]
BỘ TÀI CHÍNH
Số: 01/2026/TT-DEMO
Hà Nội, ngày 15 tháng 01 năm 2026

THÔNG TƯ
Quy định thủ tục hành chính hải quan điện tử

Chương I
NHỮNG QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
Thông tư này quy định về hồ sơ và thủ tục hải quan điện tử đối với hàng hóa xuất nhập khẩu.

Điều 5. Hồ sơ hải quan
1. Hồ sơ gồm giấy A.
2. Thời hạn xử lý là 10 ngày.

Điều 6. Phương thức nộp hồ sơ
Doanh nghiệp nộp hồ sơ trực tiếp.
`.trim();

export const DEMO_DOC_V2 = `
[SYNTHETIC DEMO DATA - NOT REAL LAW]
BỘ TÀI CHÍNH
Số: 01/2026/TT-DEMO
Hà Nội, ngày 15 tháng 01 năm 2026

THÔNG TƯ
Quy định thủ tục hành chính hải quan điện tử

Chương I
NHỮNG QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
Thông tư này quy định về hồ sơ và thủ tục hải quan điện tử đối với hàng hóa xuất nhập khẩu.

Điều 5. Hồ sơ hải quan
1. Hồ sơ gồm giấy A và giấy B.
2. Thời hạn xử lý là 5 ngày.
3. Doanh nghiệp phải lưu hồ sơ trong 3 năm.

Điều 6. Phương thức nộp hồ sơ
Doanh nghiệp có thể nộp hồ sơ điện tử.
`.trim();

export class MockRegulatoryAdapter implements RegulatorySourceAdapter {
  private currentVersion: 1 | 2 = 1;

  public setVersion(v: 1 | 2): void {
    this.currentVersion = v;
  }

  public async discoverDocuments(config: ISourceConfig): Promise<DiscoveredDocumentRef[]> {
    return [
      {
        url: config.baseUrl || 'https://demo-legal-portal.local/docs/01-2026-tt-demo',
        title: 'Thông tư DEMO 01/2026/TT-DEMO',
        documentNumber: '01/2026/TT-DEMO',
        issuingAuthority: 'BỘ TÀI CHÍNH',
        publishedDate: '2026-01-15',
        effectiveDate: '2026-03-01',
      },
    ];
  }

  public async fetchDocument(url: string, _options?: IFetchOptions): Promise<IFetchResult> {
    const rawContent = this.currentVersion === 1 ? DEMO_DOC_V1 : DEMO_DOC_V2;
    const rawBuffer = Buffer.from(rawContent, 'utf-8');
    const rawChecksum = calculateSha256(rawBuffer);

    return {
      sourceUrl: url,
      finalUrl: url,
      fetchTimestamp: new Date().toISOString(),
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      headers: {
        'content-type': 'text/html; charset=utf-8',
        etag: `"mock-v${this.currentVersion}"`,
      },
      rawContent,
      rawBuffer,
      rawChecksum,
      isNotModified: false,
    };
  }

  public async normalizeDocument(rawSnapshot: IFetchResult): Promise<INormalizedDocumentResult> {
    const normalizedText = normalizeContent(rawSnapshot.rawContent);
    const normalizedChecksum = calculateSha256(normalizedText);

    return {
      normalizedText,
      normalizedChecksum,
    };
  }
}
