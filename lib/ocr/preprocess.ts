import sharp from "sharp";
import { join } from "path";
import { tmpdir } from "os";
import type { QualityFlags } from "./quality";

/**
 * Pick zoom multiplier based on original width.
 *
 *  < 600 px  → 3x   (tiny scan / phone photo from distance)
 *  < 1400 px → 2x   (standard A4 scan at low DPI)
 *  ≥ 1400 px → 1x   (already high-res — don't waste memory)
 *
 * Cap at 3600 px so we don't produce absurdly large intermediates.
 */
function zoomWidth(originalWidth: number): number | undefined {
  if (originalWidth < 600)  return Math.min(originalWidth * 3, 3600);
  if (originalWidth < 1400) return Math.min(originalWidth * 2, 3600);
  return undefined;
}

export async function preprocessImage(filePath: string, quality: QualityFlags): Promise<string> {
  const metadata = await sharp(filePath).metadata();
  const origWidth = metadata.width ?? 800;
  const target    = zoomWidth(origWidth);

  const outputPath = join(
    tmpdir(),
    `amc-care-pre-${Date.now()}-${Math.random().toString(36).slice(2)}.png`
  );

  let pipeline = sharp(filePath)
    .rotate()      // correct EXIF orientation first
    .grayscale();

  // ── Zoom ────────────────────────────────────────────────────────────────────
  // Lanczos3 preserves fine strokes better than the default bicubic
  if (target) {
    pipeline = pipeline.resize({
      width:  target,
      kernel: sharp.kernel.lanczos3,
    });
  }

  // ── Denoise ──────────────────────────────────────────────────────────────────
  // Light blur removes sensor grain and JPEG artefacts before sharpening.
  // Only applied when the image is already soft — don't blur a crisp scan.
  if (quality.blurry || quality.score < 45) {
    pipeline = pipeline.blur(0.5);
  }

  // ── Contrast boost ────────────────────────────────────────────────────────────
  // normalize() stretches the histogram to the full 0-255 range.
  // On very dark/faded scans we follow up with a linear level lift.
  pipeline = pipeline.normalize();

  if (quality.dark) {
    // Gamma < 1 brightens midtones without clipping highlights
    pipeline = pipeline.gamma(0.75);
  }

  // ── Sharpening ────────────────────────────────────────────────────────────────
  // After upscaling, strokes need sharpening to crisp back up.
  // Blurry originals get a heavier sigma; clean scans get a light pass.
  const sigma = quality.blurry ? 2.5 : 1.6;
  const flat  = quality.blurry ? 2.0 : 1.2;   // m1 — how much to sharpen flat areas
  const edge  = quality.blurry ? 0.5 : 0.3;   // m2 — edge overshoot limit
  pipeline = pipeline.sharpen({ sigma, m1: flat, m2: edge });

  // ── Binarise ─────────────────────────────────────────────────────────────────
  // Only binarise truly unreadable scans (score < 35).
  // Medical reports often score low due to colored text or sparse ink
  // but are perfectly readable — binarising them destroys table lines
  // and wipes colored values (red/orange abnormal markers).
  if ((quality.lowContrast || quality.dark) && quality.score < 35) {
    pipeline = pipeline.threshold(155);
  }

  await pipeline.png({ compressionLevel: 1 }).toFile(outputPath);
  return outputPath;
}
