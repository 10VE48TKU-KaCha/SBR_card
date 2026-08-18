import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  return handleCleanup(req);
}

export async function POST(req: NextRequest) {
  return handleCleanup(req);
}

async function handleCleanup(req: NextRequest) {
  try {
    const now = new Date();

    // 1. Find all expired orders that are still in PENDING_PAYMENT status
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: {
          lte: now,
        },
      },
      include: {
        items: {
          include: {
            variant: {
              select: {
                productId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (expiredOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired pending orders found.",
        cancelledCount: 0,
        restoredBaseUnits: 0,
      });
    }

    let totalRestoredUnits = 0;
    const restoredProductsSummary: { [productId: string]: number } = {};

    // 2. Perform atomic stock restoration & order cancellation in a transaction
    await prisma.$transaction(async (tx) => {
      for (const order of expiredOrders) {
        // Restore baseStock for each item in the order
        for (const item of order.items) {
          const productId = item.variant.productId;
          const unitsToRestore = item.deductedBaseUnits;

          await tx.product.update({
            where: { id: productId },
            data: {
              baseStock: {
                increment: unitsToRestore,
              },
            },
          });

          totalRestoredUnits += unitsToRestore;
          restoredProductsSummary[productId] =
            (restoredProductsSummary[productId] || 0) + unitsToRestore;
        }

        // Mark order as CANCELLED
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cancelled ${expiredOrders.length} expired orders and restored ${totalRestoredUnits} base stock units.`,
      cancelledCount: expiredOrders.length,
      cancelledOrderNumbers: expiredOrders.map((o) => o.orderNumber),
      restoredBaseUnits: totalRestoredUnits,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cleanup orders cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to cleanup expired orders",
      },
      { status: 500 }
    );
  }
}
