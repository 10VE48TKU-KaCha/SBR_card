import React from "react";
import prisma from "@/lib/prisma";
import { OrderManagerClient } from "./OrderManagerClient";

export const revalidate = 0; // Dynamic

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedOrders = orders.map((o) => ({
    ...o,
    totalAmount: Number(o.totalAmount),
    shippingFee: Number(o.shippingFee),
    createdAt: o.createdAt.toISOString(),
    expiresAt: o.expiresAt.toISOString(),
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    items: o.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      variant: {
        ...i.variant,
        product: {
          ...i.variant.product,
        },
      },
    })),
  }));

  return <OrderManagerClient initialOrders={serializedOrders as any} />;
}
