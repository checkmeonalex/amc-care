import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { extname, join } from "path";
import { gunzipSync } from "zlib";
import { fetch as undiciFetch, ProxyAgent } from "undici";
import { runImagePipeline, type LabValue, type ValidationResult } from "@/lib/ocr/pipeline";
import { runVisionAnalysis, type VisionResult } from "@/lib/ai/vision";

export const config = {
  api: { bodyParser: false },
};

export type { LabValue, ValidationResult, VisionResult };

export type ExtractResult = {
  text: string;        // cleaned, human-readable text
  rawText: string;     // raw OCR output before cleanup
  tableText: string;   // tab-separated structural reconstruction (images only)
  fileType: string;
  fileName: string;
  charCount: number;
  wordCount: number;
  quality?: {
    score: number;
    blurry: boolean;
    dark: boolean;
    lowContrast: boolean;
  };
  validation?: ValidationResult;
  vision?: VisionResult;           // set when hybrid vision path ran
  visionUsed?: boolean;
};

export type ExtractResponse = ExtractResult | { error: string };

const SUPPORTED = [".png", ".jpg", ".jpeg", ".pdf", ".docx"];
const TESSDATA_URL =
  "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz";
const TESSERACT_CACHE_DIR = join(tmpdir(), "amc-care-tesseract");
const TESSERACT_ENG_DATA  = join(TESSERACT_CACHE_DIR, "eng.traineddata");

let tessdataReady: Promise<void> | null = null;

function makeDispatcher() {
  const proxyUrl =
    process.env.HTTPS_PROXY || process.env.https_proxy ||
    process.env.HTTP_PROXY  || process.env.http_proxy;
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}

async function ensureEnglishTessdata() {
  if (existsSync(TESSERACT_ENG_DATA)) return;
  if (tessdataReady) return tessdataReady;

  tessdataReady = (async () => {
    mkdirSync(TESSERACT_CACHE_DIR, { recursive: true });
    const dispatcher = makeDispatcher();
    const response   = await undiciFetch(TESSDATA_URL, {
      ...(dispatcher ? { dispatcher } : {}),
    });
    if (!response.ok) throw new Error(`OCR language download failed: HTTP ${response.status}`);
    const compressed = Buffer.from(await response.arrayBuffer());
    writeFileSync(TESSERACT_ENG_DATA, gunzipSync(compressed));
  })().finally(() => {
    tessdataReady = null;
  });

  return tessdataReady;
}

async function fromPdf(filePath: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const buffer   = readFileSync(filePath);
  const result   = await pdfParse(buffer);
  return result.text as string;
}

async function fromDocx(filePath: string): Promise<string> {
  const mammoth = await import("mammoth");
  const result  = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

function clean(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtractResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ maxFileSize: 10 * 1024 * 1024, keepExtensions: true });

  let files: formidable.Files;
  try {
    [, files] = await form.parse(req);
  } catch {
    return res.status(400).json({ error: "Failed to parse upload" });
  }

  const uploaded = (files.file as formidable.File[] | undefined)?.[0];
  if (!uploaded) return res.status(400).json({ error: "No file provided" });

  const ext = extname(uploaded.originalFilename ?? "").toLowerCase();
  if (!SUPPORTED.includes(ext)) {
    return res.status(400).json({ error: `Unsupported file type: ${ext || "unknown"}` });
  }

  try {
    let text      = "";
    let rawText   = "";
    let tableText = "";
    let quality:    ExtractResult["quality"]    = undefined;
    let validation: ExtractResult["validation"] = undefined;
    let vision:     VisionResult | undefined    = undefined;
    let visionUsed  = false;

    if (ext === ".pdf") {
      rawText = text = clean(await fromPdf(uploaded.filepath));
    } else if (ext === ".docx") {
      rawText = text = clean(await fromDocx(uploaded.filepath));
    } else {
      // ── Vision first (up to 3 attempts), OCR only if all fail ───────────────
      if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) {
        const MAX_ATTEMPTS = 3;
        let lastVisionErr: unknown;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            vision     = await runVisionAnalysis(uploaded.filepath);
            visionUsed = true;
            break;
          } catch (err) {
            lastVisionErr = err;
          }
        }

        if (!visionUsed) {
          console.error("[lab/extract] vision failed, falling back to OCR:", lastVisionErr instanceof Error ? lastVisionErr.message : lastVisionErr);
        }
      }

      // ── OCR fallback — only runs when vision failed or creds are missing ─────
      if (!visionUsed) {
        const result = await runImagePipeline(uploaded.filepath, ensureEnglishTessdata);
        rawText    = clean(result.rawText);
        tableText  = clean(result.tableText);
        text       = clean(result.cleanText);
        quality    = result.quality;
        validation = result.validation;
      }
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return res.status(200).json({
      text,
      rawText,
      tableText,
      fileType: ext.slice(1).toUpperCase(),
      fileName: uploaded.originalFilename ?? "document",
      charCount: text.length,
      wordCount,
      quality,
      validation,
      vision,
      visionUsed,
    });
  } catch (err) {
    console.error("[lab/extract]", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Failed to process file. Please try again." });
  }
}
