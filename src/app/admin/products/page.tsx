import React from "react";
import prisma from "@/lib/prisma";
import { ProductManagerClient } from "./ProductManagerClient";

export const revalidate = 0; // Dynamic

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { multiplier: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedProducts = products.map((p) => ({
    ...p,
    releaseDate: p.releaseDate ? p.releaseDate.toISOString() : null,
    variants: p.variants.map((v) => ({
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
