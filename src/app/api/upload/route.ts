import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { applyShopWatermark } from "@/lib/watermark";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = (formData.get("type") as string) || "product"; // "product" | "slip"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let processedBuffer: Buffer = buffer;
    let isWatermarked = false;

    // Apply watermark ONLY for product images, NEVER for payment slips
    if (uploadType === "product") {
      try {
        processedBuffer = Buffer.from(
          await applyShopWatermark(buffer, {
            opacity: 0.40,
            margin: 20,
          })
        );
        isWatermarked = true;
      } catch (err) {
        console.error("Failed to watermark image:", err);
      }
    }

    // Generate safe unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${uploadType}-${timestamp}-${safeName}`;

    // Target upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, processedBuffer);

    // Public URL path
    const fileUrl = `/uploads/${filename}`;

    // Also generate data URI for cloud resilience / ephemeral Railway storage fallback
    const mimeType = file.type || "image/jpeg";
    const base64Data = processedBuffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      dataUri,
      filename,
      size: processedBuffer.length,
      watermarked: isWatermarked,
      type: uploadType,
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
