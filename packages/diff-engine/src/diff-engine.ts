import { diffWordsWithSpace } from 'diff';
import {
  ChangeType,
  IChangeItem,
  IChangeSummary,
  IDiffFragment,
  ILegalNode,
  LegalNodeType,
} from '@regtracker/shared';
import { normalizeContent } from '@regtracker/legal-parser';
import { calculateSimilarity } from './similarity.js';

export interface IDiffEngineResult {
  hasChanges: boolean;
  changes: IChangeItem[];
  summary: IChangeSummary;
}

export class LegalDiffEngine {
  /**
   * Compares two versions of legal document nodes structurally.
   */
  public compare(oldNodes: ILegalNode[], newNodes: ILegalNode[]): IDiffEngineResult {
    const changes: IChangeItem[] = [];

    // Map old nodes by hierarchyPath
    const oldNodeMap = new Map<string, ILegalNode>();
    for (const node of oldNodes) {
      oldNodeMap.set(node.hierarchyPath, node);
    }

    const matchedOldPaths = new Set<string>();
    const unmatchedNewNodes: ILegalNode[] = [];

    // 1. Direct path matching
    for (const newNode of newNodes) {
      const oldNode = oldNodeMap.get(newNode.hierarchyPath);
      if (oldNode) {
        matchedOldPaths.add(newNode.hierarchyPath);
        const oldNorm = normalizeContent(oldNode.content);
        const newNorm = normalizeContent(newNode.content);

        if (oldNorm !== newNorm) {
          // MODIFIED
          const fragments = this.computeWordDiff(oldNode.content, newNode.content);
          changes.push({
            nodeType: newNode.type,
            hierarchyPath: newNode.hierarchyPath,
            changeType: ChangeType.MODIFIED,
            oldContent: oldNode.content,
            newContent: newNode.content,
            oldNodeId: oldNode.id,
            newNodeId: newNode.id,
            diffFragments: fragments,
            similarityScore: calculateSimilarity(oldNode.content, newNode.content),
          });
        }
      } else {
        unmatchedNewNodes.push(newNode);
      }
    }

    // 2. Identify remaining old nodes that were not directly matched
    const unmatchedOldNodes: ILegalNode[] = [];
    for (const oldNode of oldNodes) {
      if (!matchedOldPaths.has(oldNode.hierarchyPath)) {
        unmatchedOldNodes.push(oldNode);
      }
    }

    // 3. Similarity fallback: try to pair unmatched new nodes with unmatched old nodes of the same type
    const remainingNewNodes: ILegalNode[] = [];
    const usedOldInSimilarity = new Set<string>();

    for (const newNode of unmatchedNewNodes) {
      let bestMatch: ILegalNode | null = null;
      let highestSimilarity = 0;

      for (const oldNode of unmatchedOldNodes) {
        if (usedOldInSimilarity.has(oldNode.hierarchyPath)) continue;
        if (oldNode.type !== newNode.type) continue;

        const sim = calculateSimilarity(oldNode.content, newNode.content);
        if (sim > 0.75 && sim > highestSimilarity) {
          highestSimilarity = sim;
          bestMatch = oldNode;
        }
      }

      if (bestMatch) {
        usedOldInSimilarity.add(bestMatch.hierarchyPath);
        const fragments = this.computeWordDiff(bestMatch.content, newNode.content);
        changes.push({
          nodeType: newNode.type,
          hierarchyPath: newNode.hierarchyPath,
          changeType: ChangeType.MODIFIED,
          oldContent: bestMatch.content,
          newContent: newNode.content,
          oldNodeId: bestMatch.id,
          newNodeId: newNode.id,
          diffFragments: fragments,
          similarityScore: highestSimilarity,
          metadata: {
            renamedOrMovedFrom: bestMatch.hierarchyPath,
          },
        });
      } else {
        remainingNewNodes.push(newNode);
      }
    }

    // 4. Remaining unmatched new nodes are ADDED
    for (const newNode of remainingNewNodes) {
      changes.push({
        nodeType: newNode.type,
        hierarchyPath: newNode.hierarchyPath,
        changeType: ChangeType.ADDED,
        oldContent: null,
        newContent: newNode.content,
        newNodeId: newNode.id,
        diffFragments: [{ type: 'added', value: newNode.content }],
        similarityScore: null,
      });
    }

    // 5. Remaining unmatched old nodes that were not paired in similarity are REMOVED
    for (const oldNode of unmatchedOldNodes) {
      if (!usedOldInSimilarity.has(oldNode.hierarchyPath)) {
        changes.push({
          nodeType: oldNode.type,
          hierarchyPath: oldNode.hierarchyPath,
          changeType: ChangeType.REMOVED,
          oldContent: oldNode.content,
          newContent: null,
          oldNodeId: oldNode.id,
          diffFragments: [{ type: 'removed', value: oldNode.content }],
          similarityScore: null,
        });
      }
    }

    // Sort changes by hierarchyPath / natural order
    changes.sort((a, b) => a.hierarchyPath.localeCompare(b.hierarchyPath, 'vi'));

    const summary = this.buildSummary(changes);
    return {
      hasChanges: changes.length > 0,
      changes,
      summary,
    };
  }

  /**
   * Computes word-level diff fragments using the diff library.
   */
  public computeWordDiff(oldText: string, newText: string): IDiffFragment[] {
    const diff = diffWordsWithSpace(oldText, newText);
    return diff.map((part) => {
      if (part.added) {
        return { type: 'added', value: part.value };
      }
      if (part.removed) {
        return { type: 'removed', value: part.value };
      }
      return { type: 'common', value: part.value };
    });
  }

  /**
   * Builds deterministic summary metrics and description without AI dependence.
   */
  private buildSummary(changes: IChangeItem[]): IChangeSummary {
    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;
    const affectedArticlesSet = new Set<string>();

    for (const c of changes) {
      if (c.changeType === ChangeType.ADDED) addedCount++;
      else if (c.changeType === ChangeType.MODIFIED) modifiedCount++;
      else if (c.changeType === ChangeType.REMOVED) removedCount++;

      // Extract article if present in hierarchy path (e.g. "Điều 5")
      const articleMatch = c.hierarchyPath.match(/Điều\s+\d+/i);
      if (articleMatch) {
        affectedArticlesSet.add(articleMatch[0]);
      }
    }

    const affectedArticles = Array.from(affectedArticlesSet);

    // Clause counts specifically for prompt demo matching
    const modifiedClauses = changes.filter(
      (c) => c.nodeType === LegalNodeType.CLAUSE && c.changeType === ChangeType.MODIFIED
    ).length;
    const addedClauses = changes.filter(
      (c) => c.nodeType === LegalNodeType.CLAUSE && c.changeType === ChangeType.ADDED
    ).length;
    const removedClauses = changes.filter(
      (c) => c.nodeType === LegalNodeType.CLAUSE && c.changeType === ChangeType.REMOVED
    ).length;

    let textSummary = `Version introduces: ${modifiedCount} modified provision${modifiedCount === 1 ? '' : 's'}, ${addedCount} added, ${removedCount} removed.`;
    if (modifiedClauses > 0 || addedClauses > 0 || removedClauses > 0) {
      const modStr = `${modifiedClauses} modified clause${modifiedClauses === 1 ? '' : 's'}`;
      const addStr = `${addedClauses} new clause${addedClauses === 1 ? '' : 's'}`;
      const remStr = `${removedClauses} removed clause${removedClauses === 1 ? '' : 's'}`;
      textSummary = `Version introduces: ${modStr}, ${addStr}, ${remStr}.`;
    }

    return {
      addedCount,
      modifiedCount,
      removedCount,
      totalChanges: changes.length,
      affectedArticles,
      textSummary,
    };
  }
}
