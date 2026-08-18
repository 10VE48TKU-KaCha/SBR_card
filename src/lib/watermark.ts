import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface WatermarkOptions {
  watermarkPath?: string;
  opacity?: number; // 0.0 to 1.0 (default 0.40)
  margin?: number;  // Margin from bottom-right corner in px
  maxWatermarkWidthRatio?: number; // Ratio of base image width (default 0.22)
}

/**
 * Composites the shop's watermark logo onto product images at the bottom-right corner with 40% opacity.
 * Does NOT apply to payment slips.
 */
export async function applyShopWatermark(
  imageBuffer: Buffer | Uint8Array,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    watermarkPath = path.join(process.cwd(), "public", "logos", "watermark.png"),
    opacity = 0.40,
    margin = 24,
    maxWatermarkWidthRatio = 0.22,
  } = options;

  try {
    // 1. Inspect main image metadata
    const mainImage = sharp(imageBuffer);
    const metadata = await mainImage.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 800;

    // 2. Locate watermark file
    let resolvedWatermarkPath = watermarkPath;
    if (!fs.existsSync(resolvedWatermarkPath)) {
      const altPath = path.join(process.cwd(), "public", "logos", "sp-logo.png");
      if (fs.existsSync(altPath)) {
        resolvedWatermarkPath = altPath;
      } else {
        // If no watermark image file exists, return original image
        return Buffer.from(await mainImage.toBuffer());
      }
    }

    // 3. Scale watermark proportional to the main image
    const targetWatermarkWidth = Math.max(100, Math.min(260, Math.round(width * maxWatermarkWidthRatio)));

    // 4. Create watermark buffer with 40% opacity
    const watermarkBase = await sharp(resolvedWatermarkPath)
      .resize(targetWatermarkWidth, null, { fit: "inside" })
      .png()
      .toBuffer();

    // Multiply alpha channel by 0.4 (40% opacity)
    const watermarkAlphaAdjusted = await sharp(watermarkBase)
      .ensureAlpha()
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();

    // 5. Calculate position at the bottom-right corner
    const watermarkMeta = await sharp(watermarkAlphaAdjusted).metadata();
    const wmWidth = watermarkMeta.width || targetWatermarkWidth;
    const wmHeight = watermarkMeta.height || targetWatermarkWidth;

    const left = Math.max(0, width - wmWidth - margin);
    const top = Math.max(0, height - wmHeight - margin);

    // 6. Composite onto main image
    const watermarkedBuffer = await mainImage
      .composite([
        {
          input: watermarkAlphaAdjusted,
          top,
          left,
          blend: "over",
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return Buffer.from(watermarkedBuffer);
  } catch (error) {
    console.error("Watermarking failed, falling back to original image:", error);
    return Buffer.from(imageBuffer);
  }
}
