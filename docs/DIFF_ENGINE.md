# RegTracker Structural Diff Engine

## 1. Overview

The **RegTracker Diff Engine** (`packages/diff-engine`) is the analytical core of the platform. Unlike generic text diff tools (such as `git diff` or naive line compare), which report massive chunks of irrelevant differences when documents are re-wrapped or reformatted, RegTracker implements **domain-aware legal hierarchy diffing**.

It maps legal structures into an abstract semantic tree and compares provisions at the exact level of legal enforcement (*Phần, Chương, Mục, Điều, Khoản, Điểm*).

---

## 2. Multi-Stage Pipeline

```
Raw HTML / PDF Fetched
         │
         ▼
[ Stage 1: Content Normalization ]
 - Unicode normalization (NFC)
 - Stripping zero-width & non-breaking spaces
 - Collapsing consecutive whitespace & carriage returns
 - Retaining legal quotation, numbering & punctuation
         │
         ▼
[ Stage 2: Dual Checksum Evaluation ]
 - rawChecksum: SHA-256(rawBytes)
 - normalizedChecksum: SHA-256(normalizedText)
 - If normalizedChecksum == prevVersion.normalizedChecksum:
     => SUPPRESS VERSION CREATION (Zero False Positives)
         │
         ▼
[ Stage 3: Hierarchical Tree Stack Parsing ]
 - Reconstructs nested tree:
   Part > Chapter > Section > Article > Clause > Point
 - Each node assigned unique hierarchyPath & orderIndex
         │
         ▼
[ Stage 4: Structural Node Alignment & Matching ]
 - Primary Pass: Exact node match on (type + number + parentPath)
 - Secondary Pass: Unmatched node pool matched using Jaccard N-gram similarity
         │
         ▼
[ Stage 5: Change Item Classification ]
 - Identical normalized hash: UNCHANGED (filtered out)
 - Matched with hash change: MODIFIED + Word-Level Diff Tokenizer
 - Unmatched in New: ADDED
 - Unmatched in Old: REMOVED
         │
         ▼
[ Stage 6: Deterministic Quantitative Summary ]
 - Generates structural tallies without requiring external LLMs
```

---

## 3. False Positive Prevention

Regulatory portals often introduce non-substantive changes, such as:
1. Re-wrapping paragraphs across different line lengths.
2. Converting straight quotes `"` to curly quotes `“` or trailing spaces.
3. Modifying header banners, timestamps, or CMS footers.

RegTracker handles these cleanly:
- **Raw Snapshot Traceability:** The exact original bytes are preserved in `RawSnapshot` for legal evidence.
- **Normalization Layer:** Cleans formatting artifacts before hashing.
- **Decision Matrix:**
  | Raw Hash | Normalized Hash | System Action | Version Created? |
  | :--- | :--- | :--- | :--- |
  | Match | Match | Identical fetch; skip immediately | **No** |
  | Changed | Match | Reformat/CMS noise; update fetch logs | **No** |
  | Changed | Changed | Substantive regulatory change; run diff | **Yes (v+1)** |

---

## 4. Matching Algorithm & Similarity Fallback

### 4.1. Primary Pass: Hierarchical Coordinate Matching
Each node in a legal document has an inherent identifier:
- Article 5 -> `type = 'ARTICLE'`, `number = '5'`.
- Clause 2 of Article 5 -> `type = 'CLAUSE'`, `number = '2'`, `parent = 'Điều 5'`.

Nodes sharing the same hierarchical coordinates between versions are directly compared:
- If `sha256(content_old) === sha256(content_new)` -> `UNCHANGED`.
- If `sha256(content_old) !== sha256(content_new)` -> `MODIFIED`.

### 4.2. Secondary Pass: Jaccard N-Gram Similarity Matching
When an article or clause is unnumbered (e.g., preambles, transitional provisions, or renamed sections), naive diff tools would report the old text as `REMOVED` and the new text as `ADDED`.

RegTracker compares remaining candidates using word-level Jaccard similarity:
$$\text{Similarity}(A, B) = \frac{|A \cap B|}{|A \cup B|}$$
- If $\text{Similarity}(A, B) \ge 0.60$, the node is matched and flagged as `MODIFIED`, correctly preserving continuity.
- Below the threshold, nodes are treated as distinct `REMOVED` and `ADDED` events.

---

## 5. Word-Level Diff Tokenization

When a provision is marked `MODIFIED`, RegTracker tokenizes both versions into word tokens and executes an LCS (Longest Common Subsequence) diff.

The resulting fragments are tagged:
- `EQUAL`: Shared unchanged text (rendered in neutral slate color).
- `DELETE`: Old text removed (rendered with red background & strikethrough).
- `INSERT`: New text added (rendered with green background & highlight).

This enables regulatory lawyers and compliance officers to review updates in seconds without manually cross-referencing hundreds of pages.

---

## 6. Explicit Test Case Verification

The test suite in `packages/diff-engine/test/diff-engine.spec.ts` exercises all 8 test scenarios required by specification:

| Case | Scenario | Expected Outcome | Test Status |
| :--- | :--- | :--- | :--- |
| **Case 1** | Identical document | Zero change items generated | **PASSED** |
| **Case 2** | Whitespace-only changes | Zero change items generated | **PASSED** |
| **Case 3** | Single clause modified | Exactly 1 `MODIFIED` change item | **PASSED** |
| **Case 4** | New clause introduced | Exactly 1 `ADDED` change item | **PASSED** |
| **Case 5** | Clause repealed/deleted | Exactly 1 `REMOVED` change item | **PASSED** |
| **Case 6** | Entire article added | Exactly 1 `ADDED` Article + children | **PASSED** |
| **Case 7** | Multiple concurrent changes | All modifications, additions, and removals detected | **PASSED** |
| **Case 8** | Provisions reordered without text change | Matched by identity; no spurious addition/removal | **PASSED** |
