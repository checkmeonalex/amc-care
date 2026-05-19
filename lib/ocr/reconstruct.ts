/**
 * STRUCTURAL RECONSTRUCTION ENGINE
 *
 * Transitions from "reading text" → "understanding document geometry".
 *
 * Pipeline:
 *   [1] Flatten Tesseract word tree → flat word list with (x, y, w, h)
 *   [2] Y-axis clustering → rows (words that share the same vertical band)
 *   [3] Gap analysis → blocks (header / table / paragraph)
 *   [4] Block classification by geometry + content signals
 *   [5] Column alignment inside table blocks (x-axis clustering)
 *   [6] Emit structured rows:  Test Name | Value | Unit | Range
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type RawWord = {
  text:       string;
  x0: number; y0: number;
  x1: number; y1: number;
  confidence: number;
};

type Row = {
  words:  RawWord[];
  yMin:   number;
  yMax:   number;
  yCentre: number;
};

export type BlockType = "header" | "table" | "paragraph";

export type StructuredRow = {
  cells: string[];      // one entry per column, left → right
  raw:   string;        // fallback plain-text version
};

export type DocumentBlock = {
  type:       BlockType;
  rows:       StructuredRow[];
  columnCount: number;
};

export type StructuredDocument = {
  blocks:    DocumentBlock[];
  /** Tab-separated table lines — best input for the medical parser */
  tableText: string;
  /** Readable plain text for display */
  plainText: string;
};

// ── Tesseract word extraction ─────────────────────────────────────────────────

type TesseractWord = {
  text:       string;
  confidence: number;
  bbox:       { x0: number; y0: number; x1: number; y1: number };
};

type TesseractPage = {
  // hierarchical tree (null for thin row crops)
  blocks: Array<{
    paragraphs: Array<{
      lines: Array<{ words: TesseractWord[] }>;
    }>;
  }> | null;
  // flat word list — always populated even when blocks is null
  words?: TesseractWord[];
};

export function extractWords(page: TesseractPage): RawWord[] {
  const push = (words: RawWord[], w: TesseractWord) => {
    if (!w.text.trim() || w.confidence < 1) return;
    words.push({
      text:       w.text,
      x0:         w.bbox.x0,
      y0:         w.bbox.y0,
      x1:         w.bbox.x1,
      y1:         w.bbox.y1,
      confidence: w.confidence,
    });
  };

  const result: RawWord[] = [];

  // ── Try hierarchical blocks first ────────────────────────────────────────
  for (const block of page.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        for (const w of line.words) push(result, w);
      }
    }
  }

  // Fall back to flat words list when blocks is null or empty
  if (result.length === 0 && page.words?.length) {
    for (const w of page.words) push(result, w);
  }

  return result;
}

// ── Step 2 — Y-axis row clustering ───────────────────────────────────────────

function clusterIntoRows(words: RawWord[]): Row[] {
  if (words.length === 0) return [];

  const avgH = words.reduce((s, w) => s + (w.y1 - w.y0), 0) / words.length;
  const lineThresh = avgH * 0.65;   // words within 65% of avg height → same row

  // Sort top-to-bottom, left-to-right
  const sorted = [...words].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);

  const rows: Row[] = [];
  let current: RawWord[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const w       = sorted[i];
    const lastY   = current[current.length - 1].y0;
    if (Math.abs(w.y0 - lastY) <= lineThresh) {
      current.push(w);
    } else {
      rows.push(makeRow(current));
      current = [w];
    }
  }
  if (current.length) rows.push(makeRow(current));

  return rows;
}

function makeRow(words: RawWord[]): Row {
  const sorted = [...words].sort((a, b) => a.x0 - b.x0);
  const yMin   = Math.min(...sorted.map(w => w.y0));
  const yMax   = Math.max(...sorted.map(w => w.y1));
  return { words: sorted, yMin, yMax, yCentre: (yMin + yMax) / 2 };
}

// ── Step 3 — Gap analysis → blocks ───────────────────────────────────────────

function groupIntoBlocks(rows: Row[]): Row[][] {
  if (rows.length === 0) return [];

  const gaps: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    gaps.push(rows[i].yMin - rows[i - 1].yMax);
  }
  const avgGap   = gaps.reduce((s, g) => s + Math.max(g, 0), 0) / (gaps.length || 1);
  const gapThresh = Math.max(avgGap * 1.8, 8);

  const blocks: Row[][] = [];
  let current: Row[]    = [rows[0]];

  for (let i = 1; i < rows.length; i++) {
    const gap = rows[i].yMin - rows[i - 1].yMax;
    if (gap > gapThresh) {
      blocks.push(current);
      current = [];
    }
    current.push(rows[i]);
  }
  if (current.length) blocks.push(current);

  return blocks;
}

// ── Step 4 — Block classification ────────────────────────────────────────────

const NUMERIC_RE    = /^[<>]?\s*\d+(?:[.,]\d+)?$/;
const UNIT_RE       = /^(?:x10[³3]\/[µu][Ll]|×10[³3]\/[µu][Ll]|10\^[36]\/[µu][Ll]|mg\/d[Ll]|mmol\/[Ll]|g\/d[Ll]|g\/[Ll]|mg\/[Ll]|ng\/m[Ll]|ng\/d[Ll]|pg\/m[Ll]|µmol\/[Ll]|umol\/[Ll]|nmol\/[Ll]|pmol\/[Ll]|mIU\/m[Ll]|mIU\/[Ll]|IU\/[Ll]|U\/[Ll]|K\/[µu][Ll]|cells\/[µu][Ll]|fL|fl|pg|%|mm\/hr|sec|seconds|ratio)$/i;
const RANGE_RE      = /\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?/;

function looksLikeTableRow(row: Row): boolean {
  const texts = row.words.map(w => w.text);
  const hasNumeric = texts.some(t => NUMERIC_RE.test(t));
  const hasUnit    = texts.some(t => UNIT_RE.test(t));
  const hasRange   = texts.some(t => RANGE_RE.test(t));
  return hasNumeric || hasUnit || hasRange;
}

function classifyBlock(rows: Row[]): BlockType {
  // Table check must run first — a single row like "WBC 5.4 mg/dL 4.5-11.0"
  // has only 4 words and would be wrongly tagged "header" if we checked word
  // count first.
  const tableRowCount = rows.filter(looksLikeTableRow).length;
  if (tableRowCount / rows.length >= 0.35) return "table";

  const allWords = rows.flatMap(r => r.words).length;
  if (allWords <= 10) return "header";

  return "paragraph";
}

// ── Step 5 — Column alignment (x-axis clustering) ────────────────────────────

function detectColumnBoundaries(rows: Row[], pageWidth: number): number[] {
  const MIN_GAP   = pageWidth * 0.035;
  // For single-row crops (one lab value line) allow a gap seen in just 1 row
  const MIN_COVER = rows.length === 1 ? 1 : Math.max(2, Math.floor(rows.length * 0.25));

  const allGaps: number[] = [];

  for (const row of rows) {
    const ws = row.words;
    for (let i = 1; i < ws.length; i++) {
      const gap = ws[i].x0 - ws[i - 1].x1;
      if (gap >= MIN_GAP) {
        allGaps.push((ws[i - 1].x1 + ws[i].x0) / 2);
      }
    }
  }

  if (allGaps.length === 0) return [];

  // Cluster gap midpoints within 7 % of page width
  const radius   = pageWidth * 0.07;
  const clusters: number[][] = [];

  for (const g of allGaps) {
    const hit = clusters.find(c => Math.abs(c[0] - g) <= radius);
    hit ? hit.push(g) : clusters.push([g]);
  }

  return clusters
    .filter(c => c.length >= MIN_COVER)
    .map(c  => c.reduce((a, b) => a + b, 0) / c.length)
    .sort((a, b) => a - b);
}

function buildStructuredRow(row: Row, colBounds: number[]): StructuredRow {
  const raw = row.words.map(w => w.text).join(" ");

  if (colBounds.length === 0) {
    return { cells: [raw], raw };
  }

  const cells: string[] = new Array(colBounds.length + 1).fill("");

  for (const word of row.words) {
    const mid = (word.x0 + word.x1) / 2;
    const col = colBounds.findIndex(b => mid < b);
    const idx = col === -1 ? colBounds.length : col;
    cells[idx] = cells[idx] ? `${cells[idx]} ${word.text}` : word.text;
  }

  return { cells: cells.map(c => c.trim()), raw };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function reconstruct(
  page:      TesseractPage,
  pageWidth: number
): StructuredDocument {
  console.log("[OCR] ★ reconstruct: extracting words…");

  const words = extractWords(page);
  console.log(`[OCR] ★ reconstruct: ${words.length} words extracted`);

  if (words.length === 0) {
    return { blocks: [], tableText: "", plainText: "" };
  }

  // Step 2 — row clustering
  const rows = clusterIntoRows(words);
  console.log(`[OCR] ★ reconstruct: ${rows.length} rows clustered`);

  // Step 3 — block grouping
  const rawBlocks = groupIntoBlocks(rows);
  console.log(`[OCR] ★ reconstruct: ${rawBlocks.length} blocks detected`);

  // Step 4 + 5 — classify and align columns
  const blocks: DocumentBlock[] = [];

  for (const rawBlock of rawBlocks) {
    const type      = classifyBlock(rawBlock);
    const colBounds = type === "table"
      ? detectColumnBoundaries(rawBlock, pageWidth)
      : [];
    const colCount  = colBounds.length + 1;

    const structured = rawBlock.map(row => buildStructuredRow(row, colBounds));

    blocks.push({ type, rows: structured, columnCount: colCount });
    console.log(`[OCR] ★ block [${type}] — ${rawBlock.length} rows, ${colCount} col(s)`);
  }

  // Emit outputs
  const tableParts: string[]  = [];
  const plainParts: string[]  = [];

  for (const block of blocks) {
    if (block.type === "table") {
      for (const row of block.rows) {
        const nonEmpty = row.cells.filter(Boolean);
        if (nonEmpty.length > 0) {
          tableParts.push(nonEmpty.join("\t"));
          plainParts.push(nonEmpty.join("  "));
        }
      }
    } else {
      for (const row of block.rows) {
        plainParts.push(row.raw);
      }
    }
  }

  return {
    blocks,
    tableText: tableParts.join("\n"),
    plainText: plainParts.join("\n"),
  };
}
