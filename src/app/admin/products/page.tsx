import React from "react";
import prisma from "@/lib/prisma";
import { ProductManagerClient } from "./ProductManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      include: {
        variants: {
          orderBy: { multiplier: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("AdminProducts data fetch error:", error);
  }

  const serializedProducts = products.map((p: any) => ({
    ...p,
    releaseDate: p.releaseDate ? p.releaseDate.toISOString() : null,
    variants: (p.variants || []).map((v: any) => ({
      id: v.id,
      type: v.type,
      name: v.name,
      sku: v.sku,
      price: Number(v.price),
      multiplier: v.multiplier,
    })),
  }));

  return <ProductManagerClient initialProducts={serializedProducts as any} />;
}
