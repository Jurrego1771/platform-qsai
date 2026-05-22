import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import fs from 'fs';
import path from 'path';

const THRESHOLD = parseFloat(process.env.VISUAL_DIFF_THRESHOLD || '0.01');

export async function compareScreenshots(currentPath, baselinePath, diffOutputPath) {
  if (!fs.existsSync(baselinePath)) {
    return { hasBaseline: false, diffPercent: 0, diffPixels: 0 };
  }

  const [currentRaw, baselineRaw] = await Promise.all([
    sharp(currentPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(baselinePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);

  const { width, height } = currentRaw.info;

  let baselineBuffer = baselineRaw.data;
  if (baselineRaw.info.width !== width || baselineRaw.info.height !== height) {
    baselineBuffer = await sharp(baselinePath)
      .resize(width, height, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer();
  }

  const diffBuffer = Buffer.alloc(width * height * 4);
  const diffPixels = pixelmatch(
    baselineBuffer,
    currentRaw.data,
    diffBuffer,
    width,
    height,
    { threshold: 0.1, includeAA: false }
  );

  const totalPixels = width * height;
  const diffPercent = diffPixels / totalPixels;

  if (diffPercent > THRESHOLD) {
    fs.mkdirSync(path.dirname(diffOutputPath), { recursive: true });
    await sharp(diffBuffer, { raw: { width, height, channels: 4 } }).png().toFile(diffOutputPath);
  }

  return {
    hasBaseline: true,
    diffPercent,
    diffPixels,
    totalPixels,
    isRegression: diffPercent > THRESHOLD,
    threshold: THRESHOLD,
  };
}

export function formatDiffSummary(diffResult) {
  if (!diffResult.hasBaseline) return '⬜ Sin baseline para comparar';
  if (!diffResult.isRegression) return `✅ Sin regresión visual (${(diffResult.diffPercent * 100).toFixed(2)}% diff)`;
  return `🔴 Regresión visual: ${(diffResult.diffPercent * 100).toFixed(2)}% de pixels cambiaron (umbral: ${(diffResult.threshold * 100).toFixed(0)}%)`;
}
