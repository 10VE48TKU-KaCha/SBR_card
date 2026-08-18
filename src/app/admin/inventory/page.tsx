import React from "react";
import prisma from "@/lib/prisma";
import { InventoryClient } from "./InventoryClient";

export const revalidate = 0; // Dynamic

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
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

  return <InventoryClient initialProducts={products as any} />;
}
