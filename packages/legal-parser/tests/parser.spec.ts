import { describe, it, expect } from 'vitest';
import { calculateSha256 } from '../src/hasher.js';
import { normalizeContent, stripHtml } from '../src/normalizer.js';
import { VietnameseLegalParser } from '../src/parser.js';
import { LegalNodeType } from '@regtracker/shared';

describe('hasher & normalizer', () => {
  it('calculates deterministic SHA-256 hash', () => {
    const hash1 = calculateSha256('Hello World');
    const hash2 = calculateSha256('Hello World');
    const hash3 = calculateSha256('Hello World 2');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64);
  });

  it('strips html and normalizes whitespaces properly', () => {
    const html = `
      <div>
        <h1>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
        <p>Độc lập - Tự do - Hạnh phúc</p>
        <p>Điều 1.&nbsp;Phạm vi điều chỉnh</p>
      </div>
    `;
    const text = stripHtml(html);
    const normalized = normalizeContent(text);

    expect(normalized).toContain('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
    expect(normalized).toContain('Độc lập - Tự do - Hạnh phúc');
    expect(normalized).toContain('Điều 1. Phạm vi điều chỉnh');
    expect(normalized).not.toContain('&nbsp;');
    expect(normalized).not.toContain('<div>');
  });

  it('normalizes whitespace without changing legal text semantics', () => {
    const raw1 = 'Điều 5.\n  1.   Hồ sơ   gồm giấy A.\n  2. Thời hạn xử lý là 10 ngày.';
    const raw2 = 'Điều 5.\n1. Hồ sơ gồm giấy A.\n2. Thời hạn xử lý là 10 ngày.';
    expect(normalizeContent(raw1)).toBe(normalizeContent(raw2));
    expect(calculateSha256(normalizeContent(raw1))).toBe(calculateSha256(normalizeContent(raw2)));
  });
});

describe('VietnameseLegalParser', () => {
  const parser = new VietnameseLegalParser();

  it('parses a structured Vietnamese legal document', () => {
    const doc = `
BỘ TÀI CHÍNH
Số: 01/2026/TT-DEMO
Hà Nội, ngày 15 tháng 01 năm 2026

THÔNG TƯ
Quy định thủ tục hành chính hải quan điện tử

Căn cứ Luật Hải quan số 54/2014/QH13;
Bộ trưởng Bộ Tài chính ban hành Thông tư hướng dẫn như sau:

Chương I
NHỮNG QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
Thông tư này quy định về thủ tục hải quan điện tử.

Điều 5. Hồ sơ hải quan
1. Hồ sơ hải quan gồm:
a) Tờ khai hải quan điện tử;
b) Bản sao hóa đơn thương mại.
2. Thời hạn xử lý là 10 ngày kể từ ngày nhận đủ hồ sơ.

Điều 6. Phương thức nộp hồ sơ
Doanh nghiệp nộp hồ sơ trực tiếp hoặc gửi qua bưu điện.

Thông tư này có hiệu lực thi hành từ ngày 01 tháng 03 năm 2026.
    `;

    const result = parser.parse(doc);

    expect(result.documentNumber).toBe('01/2026/TT-DEMO');
    expect(result.issuingAuthority).toBe('BỘ TÀI CHÍNH');
    expect(result.issuingDate).toBe('2026-01-15');
    expect(result.effectiveAt).toBe('2026-03-01');

    // Hierarchy checks
    const chapterNode = result.nodes.find((n) => n.type === LegalNodeType.CHAPTER);
    expect(chapterNode).toBeDefined();
    expect(chapterNode?.number).toBe('I');

    const d5 = result.nodes.find((n) => n.type === LegalNodeType.ARTICLE && n.number === '5');
    expect(d5).toBeDefined();
    expect(d5?.hierarchyPath).toBe('Chương I > Điều 5');

    const k1 = result.nodes.find((n) => n.type === LegalNodeType.CLAUSE && n.number === '1');
    expect(k1).toBeDefined();
    expect(k1?.hierarchyPath).toBe('Chương I > Điều 5 > 1');

    const pA = result.nodes.find((n) => n.type === LegalNodeType.POINT && n.number === 'a');
    expect(pA).toBeDefined();
    expect(pA?.hierarchyPath).toBe('Chương I > Điều 5 > Khoản 1 > a');
  });

  it('preserves unclassified blocks (preambles and signatories)', () => {
    const doc = `
Lời nói đầu văn bản không theo điều khoản.
Điều 1. Điều duy nhất.
Nơi nhận:
- Như Điều 1;
- Lưu: VT.
    `;
    const result = parser.parse(doc);
    expect(result.nodes.length).toBe(3);
    expect(result.nodes[0]?.type).toBe(LegalNodeType.UNCLASSIFIED_BLOCK);
    expect(result.nodes[1]?.type).toBe(LegalNodeType.ARTICLE);
    expect(result.nodes[2]?.type).toBe(LegalNodeType.UNCLASSIFIED_BLOCK);
  });
});
