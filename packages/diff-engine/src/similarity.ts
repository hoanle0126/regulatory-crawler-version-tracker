/**
 * Calculates Dice coefficient token similarity between two strings (0.0 to 1.0).
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const tokenize = (s: string) => {
    return s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter(Boolean);
  };

  const tokens1 = tokenize(str1);
  const tokens2 = tokenize(str2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0.0;

  const set1 = new Map<string, number>();
  for (const t of tokens1) set1.set(t, (set1.get(t) ?? 0) + 1);

  let intersection = 0;
  for (const t of tokens2) {
    const count = set1.get(t);
    if (count && count > 0) {
      intersection++;
      set1.set(t, count - 1);
    }
  }

  return (2.0 * intersection) / (tokens1.length + tokens2.length);
}
