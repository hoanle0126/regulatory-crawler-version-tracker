import { ILegalNode, LegalNodeType } from '@regtracker/shared';
import { normalizeContent } from './normalizer.js';

export interface IParsedLegalDocument {
  title?: string;
  documentNumber?: string;
  issuingAuthority?: string;
  issuingDate?: string;
  effectiveAt?: string;
  nodes: ILegalNode[];
  rawText: string;
  normalizedText: string;
}

export class VietnameseLegalParser {
  private static readonly PART_REGEX = /^Phần\s+([IVXLCDM\d]+|thứ\s+[a-zA-Z\d]+)[\.:\s\-]*(.*)$/i;
  private static readonly CHAPTER_REGEX = /^Chương\s+([IVXLCDM\d]+)[\.:\s\-]*(.*)$/i;
  private static readonly SECTION_REGEX = /^Mục\s+([IVXLCDM\d]+)[\.:\s\-]*(.*)$/i;
  private static readonly ARTICLE_REGEX = /^Điều\s+(\d+)[\.:\-\s]+(.*)$/i;
  private static readonly CLAUSE_REGEX = /^(\d+)\.\s+(.*)$/;
  private static readonly POINT_REGEX = /^([a-zđ])\)\s+(.*)$/i;

  // Metadata extraction regexes
  private static readonly DOC_NUMBER_REGEX = /Số:\s*([0-9A-Za-z\/\-_]+)/i;
  private static readonly AUTHORITY_REGEX = /^(BỘ\s+[A-ZÀ-Ỹ\s]+|ỦY BAN NHÂN DÂN\s+[A-ZÀ-Ỹ\s]+|CHÍNH PHỦ|THỦ TƯỚNG CHÍNH PHỦ|QUỐC HỘI)/i;
  private static readonly DATE_REGEX = /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i;
  private static readonly EFFECTIVE_DATE_REGEX = /(?:có\s+hiệu\s+lực\s+(?:kể\s+từ|thi\s+hành\s+từ)\s+ngày\s+)(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i;
  private static readonly SIGNATORY_REGEX = /^(Nơi nhận:|BỘ TRƯỞNG|THỦ TƯỚNG|CHỦ TỊCH|GIÁM ĐỐC|KT\.|Q\.|Phụ lục\s+[IVXLCDM\d]+)/i;

  public parse(content: string): IParsedLegalDocument {
    const normalizedText = normalizeContent(content);
    const rawLines = normalizedText.split('\n');

    let currentPart: ILegalNode | null = null;
    let currentChapter: ILegalNode | null = null;
    let currentSection: ILegalNode | null = null;
    let currentArticle: ILegalNode | null = null;
    let currentClause: ILegalNode | null = null;
    let currentPoint: ILegalNode | null = null;

    const nodes: ILegalNode[] = [];
    let orderIndex = 0;

    let docNumber: string | undefined;
    let issuingAuthority: string | undefined;
    let issuingDate: string | undefined;
    let effectiveDate: string | undefined;
    let docTitle: string | undefined;

    // Helper to get current hierarchy path
    const getHierarchyPath = (type: LegalNodeType, num?: string | null, title?: string | null): string => {
      const parts: string[] = [];
      if (currentPart) {
        parts.push(`Phần ${currentPart.number ?? ''}`.trim());
      }
      if (currentChapter && type !== LegalNodeType.PART) {
        parts.push(`Chương ${currentChapter.number ?? ''}`.trim());
      }
      if (currentSection && type !== LegalNodeType.PART && type !== LegalNodeType.CHAPTER) {
        parts.push(`Mục ${currentSection.number ?? ''}`.trim());
      }
      if (currentArticle && [LegalNodeType.CLAUSE, LegalNodeType.POINT].includes(type)) {
        parts.push(`Điều ${currentArticle.number ?? ''}`.trim());
      }
      if (currentClause && type === LegalNodeType.POINT) {
        parts.push(`Khoản ${currentClause.number ?? ''}`.trim());
      }

      const selfLabel = num ? `${type === LegalNodeType.ARTICLE ? 'Điều ' : ''}${num}` : (title ?? type);
      parts.push(selfLabel);
      return parts.join(' > ');
    };

    // Buffer to accumulate lines for multi-line nodes
    let activeNode: ILegalNode | null = null;

    const flushActiveNode = () => {
      if (activeNode) {
        activeNode.content = activeNode.content.trim();
        nodes.push(activeNode);
        activeNode = null;
      }
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i]!.trim();
      if (!line) continue;

      // Extract metadata from header lines before first article if available
      if (!currentArticle) {
        if (!docNumber) {
          const matchNum = line.match(VietnameseLegalParser.DOC_NUMBER_REGEX);
          if (matchNum) docNumber = matchNum[1];
        }
        if (!issuingAuthority) {
          const matchAuth = line.match(VietnameseLegalParser.AUTHORITY_REGEX);
          if (matchAuth) issuingAuthority = matchAuth[1]?.trim();
        }
        if (!issuingDate) {
          const matchDate = line.match(VietnameseLegalParser.DATE_REGEX);
          if (matchDate) {
            const [, d, m, y] = matchDate;
            issuingDate = `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
          }
        }
        if (!docTitle && (line.startsWith('THÔNG TƯ') || line.startsWith('NGHỊ ĐỊNH') || line.startsWith('QUYẾT ĐỊNH') || line.startsWith('LUẬT'))) {
          docTitle = line;
        }
      }

      // Check effective date pattern across entire text
      if (!effectiveDate) {
        const matchEff = line.match(VietnameseLegalParser.EFFECTIVE_DATE_REGEX);
        if (matchEff) {
          const [, d, m, y] = matchEff;
          effectiveDate = `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
        }
      }

      // Check signatory / appendix blocks
      if (VietnameseLegalParser.SIGNATORY_REGEX.test(line)) {
        flushActiveNode();
        currentPart = null;
        currentChapter = null;
        currentSection = null;
        currentArticle = null;
        currentClause = null;
        currentPoint = null;

        activeNode = {
          type: LegalNodeType.UNCLASSIFIED_BLOCK,
          number: null,
          title: null,
          content: line,
          orderIndex: orderIndex++,
          hierarchyPath: `Khối văn bản kết thúc ${orderIndex}`,
        };
        continue;
      }

      // 1. Check Phần (Part)
      const partMatch = line.match(VietnameseLegalParser.PART_REGEX);
      if (partMatch) {
        flushActiveNode();
        currentChapter = null;
        currentSection = null;
        currentArticle = null;
        currentClause = null;
        currentPoint = null;

        const num = partMatch[1] ?? '';
        const title = partMatch[2]?.trim() || null;
        currentPart = {
          type: LegalNodeType.PART,
          number: num,
          title,
          content: line,
          orderIndex: orderIndex++,
          hierarchyPath: `Phần ${num}`,
        };
        activeNode = currentPart;
        continue;
      }

      // 2. Check Chương (Chapter)
      const chapterMatch = line.match(VietnameseLegalParser.CHAPTER_REGEX);
      if (chapterMatch) {
        flushActiveNode();
        currentSection = null;
        currentArticle = null;
        currentClause = null;
        currentPoint = null;

        const num = chapterMatch[1] ?? '';
        const title = chapterMatch[2]?.trim() || null;
        currentChapter = {
          type: LegalNodeType.CHAPTER,
          number: num,
          title,
          content: line,
          orderIndex: orderIndex++,
          hierarchyPath: getHierarchyPath(LegalNodeType.CHAPTER, num, title),
        };
        activeNode = currentChapter;
        continue;
      }

      // 3. Check Mục (Section)
      const sectionMatch = line.match(VietnameseLegalParser.SECTION_REGEX);
      if (sectionMatch) {
        flushActiveNode();
        currentArticle = null;
        currentClause = null;
        currentPoint = null;

        const num = sectionMatch[1] ?? '';
        const title = sectionMatch[2]?.trim() || null;
        currentSection = {
          type: LegalNodeType.SECTION,
          number: num,
          title,
          content: line,
          orderIndex: orderIndex++,
          hierarchyPath: getHierarchyPath(LegalNodeType.SECTION, num, title),
        };
        activeNode = currentSection;
        continue;
      }

      // 4. Check Điều (Article)
      const articleMatch = line.match(VietnameseLegalParser.ARTICLE_REGEX);
      if (articleMatch) {
        flushActiveNode();
        currentClause = null;
        currentPoint = null;

        const num = articleMatch[1] ?? '';
        const title = articleMatch[2]?.trim() || null;
        currentArticle = {
          type: LegalNodeType.ARTICLE,
          number: num,
          title,
          content: line,
          orderIndex: orderIndex++,
          hierarchyPath: getHierarchyPath(LegalNodeType.ARTICLE, num, title),
        };
        activeNode = currentArticle;
        continue;
      }

      // 5. Check Khoản (Clause) - valid when inside an Article
      const clauseMatch = line.match(VietnameseLegalParser.CLAUSE_REGEX);
      if (currentArticle && clauseMatch) {
        flushActiveNode();
        currentPoint = null;

        const num = clauseMatch[1] ?? '';
        currentClause = {
          type: LegalNodeType.CLAUSE,
          number: num,
          title: null,
          content: line,
          orderIndex: orderIndex++,
          hierarchyPath: getHierarchyPath(LegalNodeType.CLAUSE, num, null),
        };
        activeNode = currentClause;
        continue;
      }

      // 6. Check Điểm (Point) - valid when inside an Article/Clause
      const pointMatch = line.match(VietnameseLegalParser.POINT_REGEX);
      if (currentArticle && pointMatch) {
        flushActiveNode();

        const num = (pointMatch[1] ?? '').toLowerCase();
        currentPoint = {
          type: LegalNodeType.POINT,
          number: num,
          title: null,
          content: line,
          orderIndex: orderIndex++,
          hierarchyPath: getHierarchyPath(LegalNodeType.POINT, num, null),
        };
        activeNode = currentPoint;
        continue;
      }

      // If we have an active node, append subsequent continuation lines to it
      if (activeNode) {
        activeNode.content += '\n' + line;
      } else {
        // Unclassified block before any formal structure (e.g. preamble, header)
        activeNode = {
          type: LegalNodeType.UNCLASSIFIED_BLOCK,
          number: null,
          title: null,
          content: line,
          orderIndex: orderIndex++,
          hierarchyPath: `Khối văn bản ${orderIndex}`,
        };
      }
    }

    flushActiveNode();

    return {
      title: docTitle,
      documentNumber: docNumber,
      issuingAuthority,
      issuingDate,
      effectiveAt: effectiveDate,
      nodes,
      rawText: content,
      normalizedText,
    };
  }
}
