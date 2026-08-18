import React from "react";
import prisma from "@/lib/prisma";
import { OrderManagerClient } from "./OrderManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let orders: any[] = [];
  try {
    orders = await prisma.order.findMany({
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
  } catch (error) {
    console.error("AdminOrders data fetch error:", error);
  }

  const serializedOrders = orders.map((o: any) => ({
    ...o,
    totalAmount: Number(o.totalAmount),
    shippingFee: Number(o.shippingFee),
    createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
    expiresAt: o.expiresAt ? o.expiresAt.toISOString() : new Date().toISOString(),
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    items: (o.items || []).map((i: any) => ({
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
