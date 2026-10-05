import * as cheerio from 'cheerio';

/**
 * Strips HTML tags and normalizes structural whitespace.
 */
export function stripHtml(html: string): string {
  if (!html || !html.trim()) return '';

  const $ = cheerio.load(html);

  // Remove scripts, styles, noscript, etc.
  $('script, style, noscript, svg, nav, footer, header').remove();

  // Add newlines around block elements to prevent text merging
  $('p, div, br, li, tr, h1, h2, h3, h4, h5, h6').each((_, el) => {
    $(el).prepend('\n');
    $(el).append('\n');
  });

  const text = $.text();
  return text;
}

/**
 * Normalizes text content for legal comparison:
 * - NFC Unicode normalization (critical for Vietnamese diacritics)
 * - Converts non-breaking spaces and tabs to single spaces
 * - Trims each line and collapses excessive consecutive blank lines
 * - Preserves numbers, letters, and legal punctuation
 */
export function normalizeContent(content: string): string {
  if (!content) return '';

  // 1. Unicode NFC normalization
  let normalized = content.normalize('NFC');

  // 2. Normalize carriage returns
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Replace non-breaking spaces and tabs with normal space
  normalized = normalized.replace(/[\u00A0\u2000-\u200B\t]/g, ' ');

  // 4. Split into lines, trim each line, and collapse consecutive spaces within each line
  const lines = normalized.split('\n').map((line) => {
    return line.replace(/[ ]{2,}/g, ' ').trim();
  });

  // 5. Remove multiple consecutive empty lines (allow at most 1 empty line between blocks)
  const resultLines: string[] = [];
  let prevEmpty = false;

  for (const line of lines) {
    if (line.length === 0) {
      if (!prevEmpty) {
        resultLines.push('');
        prevEmpty = true;
      }
    } else {
      resultLines.push(line);
      prevEmpty = false;
    }
  }

  return resultLines.join('\n').trim();
}
