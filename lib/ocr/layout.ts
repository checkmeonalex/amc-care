/**
 * Layout-aware text reconstruction.
 *
 * Tesseract returns word-level bounding boxes. We use those to detect
 * column/table structure and rebuild lines that preserve label→value order,
 * preventing the classic OCR value-swap bug (Glucose 4.5 instead of 140).
 */

type BBox = { x0: number; y0: number; x1: number; y1: number };
type TWord = { text: string; confidence: number; bbox: BBox };
type TLine = { text: string; bbox: BBox; words: TWord[] };

// Minimum horizontal gap (as fraction of page width) to count as a column break
const COLUMN_GAP_RATIO = 0.04;
// A column boundary must appear in at least this fraction of lines to be "real"
const COLUMN_MIN_COVERAGE = 0.28;

function pageWidth(lines: TLine[]): number {
  if (lines.length === 0) return 1;
  return Math.max(...lines.map((l) => l.bbox.x1));
}

function detectColumnBoundaries(lines: TLine[], pgWidth: number): number[] {
  const minGap = pgWidth * COLUMN_GAP_RATIO;
  const minSupport = Math.max(2, Math.floor(lines.length * COLUMN_MIN_COVERAGE));

  // Collect gap midpoints for each line
  const allGaps: number[] = [];
  for (const line of lines) {
    const sorted = [...line.words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].bbox.x0 - sorted[i - 1].bbox.x1;
      if (gap >= minGap) {
        allGaps.push((sorted[i - 1].bbox.x1 + sorted[i].bbox.x0) / 2);
      }
    }
  }

  if (allGaps.length === 0) return [];

  // Cluster nearby gap midpoints
  const clusterRadius = pgWidth * 0.07;
  const clusters: number[][] = [];
  for (const g of allGaps) {
    const hit = clusters.find((c) => Math.abs(c[0] - g) <= clusterRadius);
    hit ? hit.push(g) : clusters.push([g]);
  }

  return clusters
    .filter((c) => c.length >= minSupport)
    .map((c) => c.reduce((a, b) => a + b, 0) / c.length)
    .sort((a, b) => a - b);
}

export function reconstructLayout(lines: TLine[]): string {
  if (lines.length === 0) return "";

  const pgWidth = pageWidth(lines);
  const colBounds = detectColumnBoundaries(lines, pgWidth);

  const result: string[] = [];

  for (const line of lines) {
    const sorted = [...line.words].sort((a, b) => a.bbox.x0 - b.bbox.x0);

    if (colBounds.length === 0) {
      // No table detected — plain text, preserve word order
      result.push(sorted.map((w) => w.text).join(" "));
      continue;
    }

    // Bucket words into detected columns
    const cells: string[] = new Array(colBounds.length + 1).fill("");
    for (const word of sorted) {
      const mid = (word.bbox.x0 + word.bbox.x1) / 2;
      const col = colBounds.findIndex((b) => mid < b);
      const idx = col === -1 ? colBounds.length : col;
      cells[idx] = cells[idx] ? `${cells[idx]} ${word.text}` : word.text;
    }

    // Tab-separate so downstream code can split columns cleanly
    result.push(cells.filter((c) => c.trim()).join("\t"));
  }

  return result.join("\n");
}
