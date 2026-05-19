import sharp from "sharp";

export type QualityFlags = {
  score: number;       // 0–100, higher is better
  blurry: boolean;
  dark: boolean;
  lowContrast: boolean;
};

export async function detectQuality(filePath: string): Promise<QualityFlags> {
  // Downsample to 256px wide for fast stats
  const { data, info } = await sharp(filePath)
    .grayscale()
    .resize(256, 256, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const n = pixels.length;
  const w = info.width;
  const h = info.height;

  // Mean brightness
  let sum = 0;
  for (let i = 0; i < n; i++) sum += pixels[i];
  const mean = sum / n;

  // Contrast via standard deviation
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (pixels[i] - mean) ** 2;
  const stdDev = Math.sqrt(variance / n);

  // Blur via Laplacian variance (higher = sharper)
  let lapSum = 0;
  let lapCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const lap =
        -pixels[idx - w - 1] - pixels[idx - w] - pixels[idx - w + 1]
        - pixels[idx - 1]    + 8 * pixels[idx]  - pixels[idx + 1]
        - pixels[idx + w - 1] - pixels[idx + w] - pixels[idx + w + 1];
      lapSum += lap * lap;
      lapCount++;
    }
  }
  const blurScore = lapCount > 0 ? lapSum / lapCount : 0;

  const blurry      = blurScore < 80;
  const dark        = mean < 70;
  const lowContrast = stdDev < 25;

  // Composite score: blur (40%), contrast (30%), brightness ok (30%)
  const brightnessOk = mean > 60 && mean < 230 ? 30 : 0;
  const score = Math.min(
    100,
    Math.round((Math.min(blurScore, 500) / 500) * 40 + (Math.min(stdDev, 80) / 80) * 30 + brightnessOk)
  );

  return { score, blurry, dark, lowContrast };
}
