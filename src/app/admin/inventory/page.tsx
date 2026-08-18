import React from "react";
import prisma from "@/lib/prisma";
import { InventoryClient } from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        franchise: true,
        images: true,
        baseStock: true,
        baseUnitName: true,
        packsPerBox: true,
        boxesPerCarton: true,
      },
      orderBy: { code: "asc" },
    });
  } catch (error) {
    console.error("AdminInventory data fetch error:", error);
  }

  return <InventoryClient initialProducts={products as any} />;
}
