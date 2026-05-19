/**
 * Full OCR pipeline:
 *
 *   Image
 *   → Quality Detection
 *   → Preprocessing          (sharp — denoise, normalise, sharpen, binarise)
 *   → Region Detection        (OpenCV — table lines or whitespace bands)
 *   → Per-row OCR             (Tesseract — single worker, one crop at a time)
 *   → Layout Reconstruction   (column gap analysis on word bboxes)
 *   → AI Cleanup              (SymSpell + Fuse.js medical terms)
 *   → Medical Parser          (regex → test / value / unit / ref range)
 *   → Validation Engine       (reference ranges + critical flags)
 */

import { rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { detectQuality, type QualityFlags } from "./quality";
import { preprocessImage } from "./preprocess";
import { detectAndCropRows, cleanupRowPaths } from "./regions";
import { reconstruct } from "./reconstruct";
import { cleanupText } from "./cleanup";
import { parseLabValues, type LabValue } from "./medical-parser";
import { validate, type ValidationResult } from "./validator";

export type { LabValue, ValidationResult };

export type OcrPipelineResult = {
  rawText:    string;
  tableText:  string;
  cleanText:  string;
  quality:    QualityFlags;
  validation: ValidationResult;
  regionMethod: "lines" | "whitespace" | "none";
};

const TESSERACT_CACHE_DIR  = join(tmpdir(), "amc-care-tesseract");
const TESSERACT_CORE_PATH  = join(process.cwd(), "node_modules", "tesseract.js-core");
const TESSERACT_WORKER_PATH = join(
  process.cwd(),
  "node_modules",
  "tesseract.js",
  "src",
  "worker-script",
  "node",
  "index.js"
);

// ── Tesseract worker factory ─────────────────────────────────────────────────

async function makeWorker() {
  const { createWorker } = await import("tesseract.js");
  return createWorker("eng", 1, {
    cachePath:   TESSERACT_CACHE_DIR,
    cacheMethod: "readOnly",
    corePath:    TESSERACT_CORE_PATH,
    workerPath:  TESSERACT_WORKER_PATH,
    logger:      () => {},
    errorHandler: (err: unknown) => console.error("[lab/ocr-worker]", err),
  });
}

// ── Region-based OCR ─────────────────────────────────────────────────────────

/**
 * OCR each cropped row with a single shared Tesseract worker, then join.
 * One worker creation avoids repeated WASM startup cost.
 */
type OcrResult = { rawText: string; tableText: string };

async function ocrRows(rowPaths: string[], pageWidth: number): Promise<OcrResult> {
  if (rowPaths.length === 0) return { rawText: "", tableText: "" };

  console.log(`[OCR] 4. starting Tesseract worker for ${rowPaths.length} rows`);
  const worker = await makeWorker();
  const rawLines:   string[] = [];
  const tableParts: string[] = [];

  try {
    for (let i = 0; i < rowPaths.length; i++) {
      console.log(`[OCR] 4.${i + 1} OCR row ${i + 1}/${rowPaths.length}`);
      const { data } = await worker.recognize(rowPaths[i], {}, { text: true, blocks: true });

      // Run structural reconstruction on this row's word data.
      const doc = reconstruct(data, pageWidth);
      const rowTable = doc.tableText.trim();
      const rowPlain = doc.plainText.trim() || data.text.trim();

      if (rowTable) tableParts.push(rowTable);
      if (rowPlain) rawLines.push(rowPlain);
    }
  } finally {
    await worker.terminate();
  }

  console.log(`[OCR] 4. row OCR complete — ${rawLines.length} non-empty rows`);
  return {
    rawText:   rawLines.join("\n"),
    tableText: tableParts.join("\n"),
  };
}

// ── Full-page OCR fallback ────────────────────────────────────────────────────

async function ocrFullPage(imagePath: string, pageWidth: number): Promise<OcrResult> {
  console.log("[OCR] 4. starting full-page OCR (no regions detected)");
  const worker = await makeWorker();

  try {
    const { data } = await worker.recognize(imagePath, {}, { text: true, blocks: true });
    const doc = reconstruct(data, pageWidth);
    console.log("[OCR] 4. full-page OCR complete");
    return { rawText: doc.plainText, tableText: doc.tableText };
  } finally {
    await worker.terminate();
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runImagePipeline(
  filePath: string,
  ensureTessdata: () => Promise<void>
): Promise<OcrPipelineResult> {

  console.log("[OCR] 1. image received:", filePath);

  // ── 1. Quality Detection ───────────────────────────────────────────────────
  const quality = await detectQuality(filePath);
  console.log(
    `[OCR] 2. quality detected — score: ${quality.score}` +
    (quality.blurry      ? " | BLURRY"       : "") +
    (quality.dark        ? " | DARK"         : "") +
    (quality.lowContrast ? " | LOW-CONTRAST" : "")
  );

  // ── 2. Preprocessing ──────────────────────────────────────────────────────
  const preprocessedPath = await preprocessImage(filePath, quality);
  console.log("[OCR] 3. preprocessing done →", preprocessedPath);

  // Read image width so reconstruct() can compute relative column gaps
  const { default: sharp } = await import("sharp");
  const meta      = await sharp(preprocessedPath).metadata();
  const pageWidth = meta.width ?? 1000;

  let rawText      = "";
  let tableText    = "";
  let regionMethod: OcrPipelineResult["regionMethod"] = "none";

  try {
    // ── 3. Tessdata check ─────────────────────────────────────────────────
    console.log("[OCR] 3a. checking tessdata…");
    await ensureTessdata();
    console.log("[OCR] 3a. tessdata ready");

    // ── 3b. Region Detection ──────────────────────────────────────────────
    console.log("[OCR] 3b. detecting row regions…");
    const detection = await detectAndCropRows(preprocessedPath);
    regionMethod    = detection.method;
    console.log(
      `[OCR] 3b. region detection done — method: ${detection.method}` +
      `, rows: ${detection.regions.length}` +
      `, crops: ${detection.rowPaths.length}`
    );

    // Only use region-based OCR when rows are meaningful:
    //   • at least 2 crops
    //   • no more than 40 (more = over-fragmented, full-page is better)
    //   • average row height ≥ 28px (thinner = Tesseract returns nothing)
    const avgRowH = detection.regions.length > 0
      ? detection.regions.reduce((s, r) => s + r.h, 0) / detection.regions.length
      : 0;
    // avgRowH > 120px means the detector found section separators, not
    // individual data rows — full-page OCR handles that better.
    const useRowOcr = detection.rowPaths.length >= 2
                   && detection.rowPaths.length <= 40
                   && avgRowH >= 28
                   && avgRowH <= 120;

    console.log(
      `[OCR] 3c. row check — count: ${detection.rowPaths.length}` +
      `, avgH: ${Math.round(avgRowH)}px` +
      `, useRowOcr: ${useRowOcr}`
    );

    try {
      const result = useRowOcr
        ? await ocrRows(detection.rowPaths, pageWidth)
        : await ocrFullPage(preprocessedPath, pageWidth);

      rawText   = result.rawText;
      tableText = result.tableText;
    } finally {
      cleanupRowPaths(detection.rowPaths);
    }
  } finally {
    rmSync(preprocessedPath, { force: true });
  }

  // ── 5. AI Cleanup (SymSpell + Fuse.js) ────────────────────────────────────
  console.log("[OCR] 5. running AI cleanup (SymSpell + Fuse.js)…");
  // Combine tableText (structured, tab-separated) + rawText (full coverage).
  // tableText alone often only contains the patient-info section when the
  // line detector found section separators instead of individual data rows.
  const combined = [tableText, rawText].filter(Boolean).join("\n");
  const cleanText = cleanupText(combined || tableText || rawText);
  console.log("[OCR] 5. cleanup done");

  // ── 6. Medical Parser — feeds on structured tableText ─────────────────────
  console.log("[OCR] 6. parsing medical values…");
  const labValues = parseLabValues(cleanText);
  console.log(`[OCR] 6. parser found ${labValues.length} lab values`);

  // ── 7. Validation Engine ──────────────────────────────────────────────────
  console.log("[OCR] 7. validating against reference ranges…");
  const validation = validate(labValues);
  console.log(
    `[OCR] 7. validation done — confidence: ${validation.confidence}%` +
    `, flagged: ${validation.flagged.length}` +
    `, criticals: ${validation.criticals.length}`
  );

  console.log("[OCR] ✓ pipeline complete");
  return { rawText, tableText, cleanText, quality, validation, regionMethod };
}
