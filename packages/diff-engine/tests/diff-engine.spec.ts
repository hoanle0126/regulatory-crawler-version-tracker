import { describe, it, expect } from 'vitest';
import { VietnameseLegalParser } from '@regtracker/legal-parser';
import { LegalDiffEngine } from '../src/diff-engine.js';
import { ChangeType, LegalNodeType } from '@regtracker/shared';

describe('LegalDiffEngine - Explicit Test Cases (Prompt Section 53)', () => {
  const parser = new VietnameseLegalParser();
  const diffEngine = new LegalDiffEngine();

  // CASE 1: Identical document
  it('CASE 1: Identical document produces no changes', () => {
    const text = `
Điều 1. Phạm vi
Văn bản quy định về hải quan.
    `;
    const docA = parser.parse(text);
    const docB = parser.parse(text);

    const result = diffEngine.compare(docA.nodes, docB.nodes);
    expect(result.hasChanges).toBe(false);
    expect(result.changes.length).toBe(0);
    expect(result.summary.totalChanges).toBe(0);
  });

  // CASE 2: Whitespace-only change
  it('CASE 2: Whitespace-only change produces no substantive changes', () => {
    const textA = 'Điều 5.\n1. Hồ sơ gồm giấy A.\n2. Thời hạn xử lý là 10 ngày.';
    const textB = 'Điều 5.\n   1.   Hồ sơ gồm giấy A.   \n\n2. Thời hạn xử lý là 10 ngày.  ';

    const docA = parser.parse(textA);
    const docB = parser.parse(textB);

    const result = diffEngine.compare(docA.nodes, docB.nodes);
    expect(result.hasChanges).toBe(false);
    expect(result.changes.length).toBe(0);
  });

  // CASE 3: One clause modified
  it('CASE 3: One clause modified is detected as MODIFIED exactly once', () => {
    const textA = `
Điều 5.
1. Thời hạn xử lý là 10 ngày.
2. Giấy tờ nộp 01 bản.
    `;
    const textB = `
Điều 5.
1. Thời hạn xử lý là 5 ngày.
2. Giấy tờ nộp 01 bản.
    `;
    const docA = parser.parse(textA);
    const docB = parser.parse(textB);

    const result = diffEngine.compare(docA.nodes, docB.nodes);
    expect(result.hasChanges).toBe(true);
    expect(result.changes.length).toBe(1);

    const change = result.changes[0];
    expect(change?.changeType).toBe(ChangeType.MODIFIED);
    expect(change?.nodeType).toBe(LegalNodeType.CLAUSE);
    expect(change?.oldContent).toContain('10 ngày');
    expect(change?.newContent).toContain('5 ngày');
    expect(change?.diffFragments).toBeDefined();

    // Check word diff fragments
    const removedFrag = change?.diffFragments?.find((f) => f.type === 'removed');
    const addedFrag = change?.diffFragments?.find((f) => f.type === 'added');
    expect(removedFrag?.value).toContain('10');
    expect(addedFrag?.value).toContain('5');
  });

  // CASE 4: New clause added
  it('CASE 4: New clause is detected as ADDED', () => {
    const textA = `
Điều 5.
1. Hồ sơ gồm A.
    `;
    const textB = `
Điều 5.
1. Hồ sơ gồm A.
2. Hồ sơ bổ sung giấy B.
    `;
    const docA = parser.parse(textA);
    const docB = parser.parse(textB);

    const result = diffEngine.compare(docA.nodes, docB.nodes);
    expect(result.hasChanges).toBe(true);
    expect(result.changes.length).toBe(1);

    const change = result.changes[0];
    expect(change?.changeType).toBe(ChangeType.ADDED);
    expect(change?.nodeType).toBe(LegalNodeType.CLAUSE);
    expect(change?.newContent).toContain('Hồ sơ bổ sung giấy B');
  });

  // CASE 5: Removed clause
  it('CASE 5: Removed clause is detected as REMOVED', () => {
    const textA = `
Điều 5.
1. Hồ sơ gồm A.
2. Quy định đã lỗi thời.
    `;
    const textB = `
Điều 5.
1. Hồ sơ gồm A.
    `;
    const docA = parser.parse(textA);
    const docB = parser.parse(textB);

    const result = diffEngine.compare(docA.nodes, docB.nodes);
    expect(result.hasChanges).toBe(true);
    expect(result.changes.length).toBe(1);

    const change = result.changes[0];
    expect(change?.changeType).toBe(ChangeType.REMOVED);
    expect(change?.nodeType).toBe(LegalNodeType.CLAUSE);
    expect(change?.oldContent).toContain('Quy định đã lỗi thời');
  });

  // CASE 6: Article added
  it('CASE 6: Article added is detected as ADDED', () => {
    const textA = `
Điều 1. Phạm vi
Quy định ban đầu.
    `;
    const textB = `
Điều 1. Phạm vi
Quy định ban đầu.

Điều 2. Đối tượng áp dụng
Cơ quan và doanh nghiệp.
    `;
    const docA = parser.parse(textA);
    const docB = parser.parse(textB);

    const result = diffEngine.compare(docA.nodes, docB.nodes);
    expect(result.hasChanges).toBe(true);
    const addedArticle = result.changes.find(
      (c) => c.nodeType === LegalNodeType.ARTICLE && c.changeType === ChangeType.ADDED
    );
    expect(addedArticle).toBeDefined();
    expect(addedArticle?.hierarchyPath).toContain('Điều 2');
  });

  // CASE 7: Multiple changes (Synthetic Demo Scenario from Prompt Section 49)
  it('CASE 7: Multiple changes in demo scenario are correctly detected', () => {
    const version1 = `
Điều 5.
1. Hồ sơ gồm giấy A.
2. Thời hạn xử lý là 10 ngày.

Điều 6.
Doanh nghiệp nộp hồ sơ trực tiếp.
    `;

    const version2 = `
Điều 5.
1. Hồ sơ gồm giấy A và giấy B.
2. Thời hạn xử lý là 5 ngày.
3. Doanh nghiệp phải lưu hồ sơ trong 3 năm.

Điều 6.
Doanh nghiệp có thể nộp hồ sơ điện tử.
    `;

    const doc1 = parser.parse(version1);
    const doc2 = parser.parse(version2);

    const result = diffEngine.compare(doc1.nodes, doc2.nodes);

    expect(result.hasChanges).toBe(true);
    // Expected:
    // Điều 5 Khoản 1: MODIFIED
    // Điều 5 Khoản 2: MODIFIED
    // Điều 5 Khoản 3: ADDED
    // Điều 6: MODIFIED
    expect(result.summary.modifiedCount).toBe(3);
    expect(result.summary.addedCount).toBe(1);
    expect(result.summary.removedCount).toBe(0);
    expect(result.summary.affectedArticles).toContain('Điều 5');
    expect(result.summary.affectedArticles).toContain('Điều 6');

    expect(result.summary.textSummary).toBe(
      'Version introduces: 2 modified clauses, 1 new clause, 0 removed clauses.'
    );
  });

  // CASE 8: Reordered clauses/articles
  it('CASE 8: Reordered provisions handled without false additions/removals', () => {
    const textA = `
Điều 1. Phạm vi
Quy định ban đầu.

Điều 2. Định nghĩa
Từ ngữ chuyên ngành hải quan.
    `;
    // Reordered order in text: Điều 2 before Điều 1
    const textB = `
Điều 2. Định nghĩa
Từ ngữ chuyên ngành hải quan.

Điều 1. Phạm vi
Quy định ban đầu.
    `;
    const docA = parser.parse(textA);
    const docB = parser.parse(textB);

    const result = diffEngine.compare(docA.nodes, docB.nodes);
    // Since content at Điều 1 and Điều 2 did not change, structural hierarchy matching should report 0 changes!
    expect(result.changes.length).toBe(0);
    expect(result.hasChanges).toBe(false);
  });
});
