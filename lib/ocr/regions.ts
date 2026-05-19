/**
 * Region-based row detection — pure sharp, zero WASM.
 *
 * Two strategies (tried in order):
 *
 *  1. LINE  — scan each pixel row for a near-solid dark band (drawn table
 *             line). Rows between consecutive lines become OCR regions.
 *
 *  2. WHITESPACE — build a horizontal dark-pixel histogram, slice on bands
 *             where almost no ink is present. Works on borderless tables.
 *
 * Both run on raw Uint8 grayscale data via sharp — no OpenCV, no WASM.
 */

import sharp from "sharp";
import { join } from "path";
import { tmpdir } from "os";
import { rmSync } from "fs";

export type RowRegion = { x: number; y: number; w: number; h: number };
export type DetectionMethod = "lines" | "whitespace" | "none";

export type RegionDetectionResult = {
  regions:    RowRegion[];
  method:     DetectionMethod;
  rowPaths:   string[];   // temp PNGs — caller must delete
};

// ── Pixel helpers ─────────────────────────────────────────────────────────────

async function getRawGray(imagePath: string) {
  const { data, info } = await sharp(imagePath)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { pixels: new Uint8Array(data), width: info.width, height: info.height };
}

/** Count dark pixels (< threshold) in a single row. */
function darkCount(pixels: Uint8Array, width: number, row: number, thresh = 80): number {
  let n = 0;
  const base = row * width;
  for (let x = 0; x < width; x++) if (pixels[base + x] < thresh) n++;
  return n;
}

// ── Strategy 1 — line-based ──────────────────────────────────────────────────

/**
 * A drawn table line = a pixel row where ≥ 60 % of pixels are dark.
 * Collect the centre y of every such run, then make row regions from gaps.
 */
function detectByLines(
  pixels: Uint8Array,
  width:  number,
  height: number
): RowRegion[] {
  const LINE_FILL = 0.60;   // fraction of row that must be dark
  const MIN_ROW_H = 22;

  // Build per-row dark fraction
  const inLine: boolean[] = new Array(height).fill(false);
  for (let y = 0; y < height; y++) {
    inLine[y] = darkCount(pixels, width, y) / width >= LINE_FILL;
  }

  // Merge consecutive line pixels into line bands, record their centres
  const lineCentres: number[] = [];
  let bandStart = -1;
  for (let y = 0; y <= height; y++) {
    const on = y < height && inLine[y];
    if (on && bandStart < 0)        bandStart = y;
    if (!on && bandStart >= 0) {
      lineCentres.push(Math.round((bandStart + y - 1) / 2));
      bandStart = -1;
    }
  }

  if (lineCentres.length < 2) return [];

  // Gaps between consecutive lines = row regions
  const regions: RowRegion[] = [];
  for (let i = 0; i < lineCentres.length - 1; i++) {
    const top = lineCentres[i];
    const bot = lineCentres[i + 1];
    const h   = bot - top;
    if (h >= MIN_ROW_H && h <= height * 0.5) {
      regions.push({ x: 0, y: top, w: width, h });
    }
  }

  return regions;
}

// ── Strategy 2 — whitespace-based ────────────────────────────────────────────

/**
 * Build a horizontal dark-pixel histogram. Slices between near-empty rows.
 */
function detectByWhitespace(
  pixels: Uint8Array,
  width:  number,
  height: number
): RowRegion[] {
  const EMPTY_THRESH = width * 0.012;   // < 1.2 % dark = empty row
  const MIN_ROW_H    = 22;              // rows shorter than this won't OCR reliably

  const regions: RowRegion[] = [];
  let inText    = false;
  let textStart = 0;

  for (let y = 0; y <= height; y++) {
    const isEmpty = y === height || darkCount(pixels, width, y) <= EMPTY_THRESH;

    if (!inText && !isEmpty) { inText = true; textStart = y; }
    else if (inText && isEmpty) {
      inText = false;
      const h = y - textStart;
      if (h >= MIN_ROW_H) regions.push({ x: 0, y: textStart, w: width, h });
    }
  }

  return regions;
}

// ── Crop helper ───────────────────────────────────────────────────────────────

async function cropRow(
  sourcePath: string,
  region:     RowRegion,
  imgWidth:   number,
  imgHeight:  number,
  pad = 5
): Promise<string> {
  const left   = Math.max(0, region.x - pad);
  const top    = Math.max(0, region.y - pad);
  const width  = Math.min(imgWidth  - left, region.w + pad * 2);
  const height = Math.min(imgHeight - top,  region.h + pad * 2);

  const outPath = join(
    tmpdir(),
    `amc-row-${Date.now()}-${Math.random().toString(36).slice(2)}.png`
  );

  await sharp(sourcePath)
    .extract({ left, top, width, height })
    .png()
    .toFile(outPath);

  return outPath;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function detectAndCropRows(
  preprocessedPath: string
): Promise<RegionDetectionResult> {
  const { pixels, width, height } = await getRawGray(preprocessedPath);

  let regions: RowRegion[] = [];
  let method:  DetectionMethod = "none";

  regions = detectByLines(pixels, width, height);
  if (regions.length >= 2) {
    method = "lines";
  } else {
    regions = detectByWhitespace(pixels, width, height);
    if (regions.length >= 2) method = "whitespace";
  }

  if (method === "none") return { regions: [], method, rowPaths: [] };

  // Crop each region to a temp PNG
  const rowPaths: string[] = [];
  for (const region of regions) {
    try {
      rowPaths.push(await cropRow(preprocessedPath, region, width, height));
    } catch {
      // skip uncroppable slice
    }
  }

  return { regions, method, rowPaths };
}

export function cleanupRowPaths(rowPaths: string[]): void {
  for (const p of rowPaths) rmSync(p, { force: true });
}
