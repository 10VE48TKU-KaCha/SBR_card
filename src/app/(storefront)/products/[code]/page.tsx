import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const product = await prisma.product.findUnique({
    where: { code },
  });

  if (!product) {
    return {
      title: "ไม่พบสินค้า - ร้านสุภาพบุรุษ",
    };
  }

  return {
    title: `${product.name} | ร้านสุภาพบุรุษ (Supapburut)`,
    description: product.description || "สั่งซื้อการ์ดเกมแท้ลิขสิทธิ์จากร้านสุภาพบุรุษ",
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  // Await params in Next.js 15
  const { code } = await params;

  const product = await prisma.product.findUnique({
    where: { code },
    include: {
      variants: {
        orderBy: { multiplier: "asc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Format serializable data for client component
  const serializedProduct = {
    ...product,
    releaseDate: product.releaseDate ? product.releaseDate.toISOString() : null,
    variants: product.variants.map((v) => ({
      id: v.id,
      type: v.type,
      name: v.name,
      sku: v.sku,
      price: Number(v.price),
      multiplier: v.multiplier,
    })),
  };

  return <ProductDetailClient product={serializedProduct as any} />;
}
