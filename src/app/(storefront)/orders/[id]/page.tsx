import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { generateDynamicPromptPayQR } from "@/lib/promptpay";
import { OrderDetailClient } from "./OrderDetailClient";
import type { Metadata } from "next";

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `คำสั่งซื้อ #${id} | ร้านสุภาพบุรุษ`,
    description: "ตรวจสอบสถานะคำสั่งซื้อและชำระเงินผ่าน PromptPay QR",
  };
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  // Await params in Next.js 15
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Generate dynamic PromptPay QR code with exact decimal amount
  const promptPayData = await generateDynamicPromptPayQR(Number(order.totalAmount));

  // Serialize Decimal objects for Client Component
  const serializedOrder = {
    ...order,
    totalAmount: Number(order.totalAmount),
    shippingFee: Number(order.shippingFee),
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      variant: {
        ...item.variant,
        price: Number(item.variant.price),
        product: {
          ...item.variant.product,
        },
      },
    })),
  };

  return (
    <OrderDetailClient
      order={serializedOrder as any}
      promptPay={promptPayData}
    />
  );
}
