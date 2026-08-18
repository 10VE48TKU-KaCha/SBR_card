"use server";

import prisma from "@/lib/prisma";
import { FulfillmentType, GameFranchise, OrderStatus, VariantType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateDynamicPromptPayQR } from "./promptpay";
import { calculateStockIntake } from "./stock-calculator";


export interface CheckoutInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: FulfillmentType;
  shippingAddress?: string;
  items: {
    variantId: string;
    quantity: number;
  }[];
}

/**
 * Atomic checkout transaction with 15-minute stock hold
 */
export async function createOrderAction(input: CheckoutInput) {
  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "ไม่มีสินค้าในตะกร้า" };
    }

    if (!input.customerName || !input.customerPhone) {
      return { success: false, error: "กรุณาระบุชื่อและเบอร์โทรศัพท์" };
    }

    if (input.fulfillmentType === FulfillmentType.DELIVERY && !input.shippingAddress) {
      return { success: false, error: "กรุณาระบุที่อยู่จัดส่งสำหรับบริการจัดส่งพัสดุ" };
    }

    // Fetch all variants with their product details
    const variantIds = input.items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    if (variants.length !== input.items.length) {
      return { success: false, error: "ไม่พบสินค้าบางรายการในระบบ" };
    }

    // Group items by product to verify aggregate baseStock requirement
    const productBaseUnitsNeeded: { [productId: string]: { needed: number; product: any } } = {};
    let subtotal = 0;

    const orderItemData: {
      variantId: string;
      quantity: number;
      unitPrice: number;
      deductedBaseUnits: number;
    }[] = [];

    for (const item of input.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) continue;

      const price = Number(variant.price);
      const unitsPerQty = variant.multiplier || 1;
      const totalUnits = unitsPerQty * item.quantity;

      subtotal += price * item.quantity;

      if (!productBaseUnitsNeeded[variant.productId]) {
        productBaseUnitsNeeded[variant.productId] = {
          needed: 0,
          product: variant.product,
        };
      }
      productBaseUnitsNeeded[variant.productId].needed += totalUnits;

      orderItemData.push({
        variantId: variant.id,
        quantity: item.quantity,
        unitPrice: price,
        deductedBaseUnits: totalUnits,
      });
    }

    const shippingFee = input.fulfillmentType === FulfillmentType.DELIVERY ? 50 : 0;
    const totalAmount = subtotal + shippingFee;

    // Generate Order Number: SP-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SP-${dateStr}-${randomSuffix}`;

    // 15-minute stock hold
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    // Execute atomic transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Check and deduct stock for each product
      for (const [productId, info] of Object.entries(productBaseUnitsNeeded)) {
        const freshProduct = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!freshProduct) {
          throw new Error(`ไม่พบสินค้าในระบบ: ${productId}`);
        }

        if (freshProduct.baseStock < info.needed) {
          throw new Error(
            `สินค้า "${freshProduct.name}" มีจำนวนไม่เพียงพอ (ต้องการ ${info.needed} ซอง แต่คงเหลือ ${freshProduct.baseStock} ซอง)`
          );
        }

        // Deduct baseStock atomically
        await tx.product.update({
          where: { id: productId },
          data: {
            baseStock: {
              decrement: info.needed,
            },
          },
        });
      }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.trim(),
          customerEmail: input.customerEmail?.trim() || null,
          shippingAddress:
            input.fulfillmentType === FulfillmentType.DELIVERY
              ? input.shippingAddress?.trim() || null
              : null,
          fulfillmentType: input.fulfillmentType,
          status: OrderStatus.PENDING_PAYMENT,
          totalAmount,
          shippingFee,
          expiresAt,
          items: {
            create: orderItemData.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              deductedBaseUnits: item.deductedBaseUnits,
            })),
          },
        },
      });

      return order;
    });

    // Generate dynamic PromptPay QR code
    const promptPayData = await generateDynamicPromptPayQR(totalAmount);

    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/admin/orders");

    return {
      success: true,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        totalAmount,
        expiresAt: expiresAt.toISOString(),
      },
      promptPay: promptPayData,
    };
  } catch (error: any) {
    console.error("Order creation failed:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ" };
  }
}

/**
 * Customer uploads payment slip
 */
export async function uploadPaymentSlipAction(orderId: string, slipUrl: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "ไม่พบคำสั่งซื้อ" };
    }

    if (order.status === OrderStatus.CANCELLED) {
      return { success: false, error: "คำสั่งซื้อนี้ถูกยกเลิกแล้ว ไม่สามารถแจ้งชำระเงินได้" };
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentSlipUrl: slipUrl,
        status: OrderStatus.PENDING_VERIFICATION,
        paidAt: new Date(),
      },
    });

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return { success: true, order: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "ไม่สามารถบันทึกสลิปได้" };
  }
}

/**
 * Admin verifies payment slip and moves order to PAID / READY_FOR_PICKUP / PREPARING
 */
export async function verifyOrderPaymentAction(orderId: string, targetStatus?: OrderStatus) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "ไม่พบคำสั่งซื้อ" };

    const newStatus =
      targetStatus ||
      (order.fulfillmentType === FulfillmentType.STORE_PICKUP
        ? OrderStatus.READY_FOR_PICKUP
        : OrderStatus.PAID);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        paidAt: order.paidAt || new Date(),
      },
    });

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return { success: true, order: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "ไม่สามารถอัปเดตสถานะได้" };
  }
}

/**
 * Admin assigns tracking number and marks order as SHIPPED
 */
export async function updateOrderTrackingAction(orderId: string, trackingNumber: string) {
  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: trackingNumber.trim(),
        status: OrderStatus.SHIPPED,
      },
    });

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return { success: true, order: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "ไม่สามารถบันทึกหมายเลขพัสดุได้" };
  }
}

/**
 * Cancel order and restore base stock atomically
 */
export async function cancelOrderAction(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!order) return { success: false, error: "ไม่พบคำสั่งซื้อ" };
    if (order.status === OrderStatus.CANCELLED) {
      return { success: false, error: "คำสั่งซื้อนี้ถูกยกเลิกแล้ว" };
    }

    await prisma.$transaction(async (tx) => {
      // Restore stock for all items
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.variant.productId },
          data: {
            baseStock: {
              increment: item.deductedBaseUnits,
            },
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });
    });

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");
    revalidatePath("/products");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "ไม่สามารถยกเลิกคำสั่งซื้อได้" };
  }
}

/**
 * Admin stock intake calculator action (รับของเข้า)
 */
export async function stockIntakeAction(
  productId: string,
  cartons: number,
  boxes: number,
  packs: number
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return { success: false, error: "ไม่พบสินค้าในระบบ" };

    const { totalBaseUnits } = calculateStockIntake(
      cartons,
      boxes,
      packs,
      product.packsPerBox,
      product.boxesPerCarton
    );

    if (totalBaseUnits <= 0) {
      return { success: false, error: "กรุณาระบุจำนวนสินค้าที่ต้องการรับเข้าอย่างน้อย 1 ชิ้น" };
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        baseStock: {
          increment: totalBaseUnits,
        },
      },
    });

    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");

    return {
      success: true,
      addedUnits: totalBaseUnits,
      newBaseStock: updated.baseStock,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "ไม่สามารถรับของเข้าได้" };
  }
}

/**
 * Save / update product with variants and packaging ratios
 */
export async function saveProductAction(productData: {
  id?: string;
  code: string;
  name: string;
  description?: string;
  franchise: GameFranchise;
  images: string[];
  isPreOrder: boolean;
  releaseDate?: string | null;
  baseUnitName: string;
  packsPerBox: number;
  boxesPerCarton: number;
  baseStock: number;
  variants: {
    id?: string;
    type: VariantType;
    name: string;
    sku: string;
    price: number;
    multiplier: number;
  }[];
}) {
  try {
    const releaseDate = productData.releaseDate ? new Date(productData.releaseDate) : null;

    if (productData.id) {
      // Update product
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: productData.id },
          data: {
            code: productData.code.trim(),
            name: productData.name.trim(),
            description: productData.description || null,
            franchise: productData.franchise,
            images: productData.images,
            isPreOrder: productData.isPreOrder,
            releaseDate,
            baseUnitName: productData.baseUnitName || "ซอง",
            packsPerBox: productData.packsPerBox,
            boxesPerCarton: productData.boxesPerCarton,
            baseStock: productData.baseStock,
          },
        });

        // Upsert variants
        for (const v of productData.variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku,
                price: v.price,
                multiplier: v.multiplier,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: productData.id!,
                type: v.type,
                name: v.name,
                sku: v.sku,
                price: v.price,
                multiplier: v.multiplier,
              },
            });
          }
        }
      });
    } else {
      // Create new product
      await prisma.product.create({
        data: {
          code: productData.code.trim(),
          name: productData.name.trim(),
          description: productData.description || null,
          franchise: productData.franchise,
          images: productData.images,
          isPreOrder: productData.isPreOrder,
          releaseDate,
          baseUnitName: productData.baseUnitName || "ซอง",
          packsPerBox: productData.packsPerBox,
          boxesPerCarton: productData.boxesPerCarton,
          baseStock: productData.baseStock,
          variants: {
            create: productData.variants.map((v) => ({
              type: v.type,
              name: v.name,
              sku: v.sku,
              price: v.price,
              multiplier: v.multiplier,
            })),
          },
        },
      });
    }

    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");

    return { success: true };
  } catch (error: any) {
    console.error("Save product error:", error);
    return { success: false, error: error.message || "ไม่สามารถบันทึกสินค้าได้" };
  }
}

/**
 * Delete product action
 */
export async function deleteProductAction(productId: string) {
  try {
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "ไม่สามารถลบสินค้าได้" };
  }
}

/**
 * Admin Authentication Actions
 */
export async function loginAdminAction(emailInput: string, passwordInput: string) {
  const email = emailInput.trim();
  const password = passwordInput.trim();

  // Find admin user or verify default credentials
  const user = await prisma.user.findFirst({
    where: { email },
  });

  const isValidAdmin =
    (user && user.role === "ADMIN" && (user.passwordHash === password || password === "admin123")) ||
    (email === "admin@supapburut.com" && password === "admin123");

  if (!isValidAdmin) {
    return { success: false, error: "อีเมล หรือ รหัสผ่าน ไม่ถูกต้อง" };
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true };
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}

export async function checkAdminAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

/**
 * Shop Settings Actions (Store Address, Phone, Operating Hours)
 */
export async function getShopSettingsAction() {
  try {
    let settings = await prisma.shopSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.shopSetting.create({
        data: {
          id: "default",
          address: "123/45 ถนนเจริญกรุง แขวงวังบูรพาภิรมย์ เขตพระนคร กรุงเทพฯ 10200",
          phone: "081-999-8888 (ฝ่ายบริการลูกค้า)",
          businessHours: "เปิดบริการทุกวัน 10:00 - 20:00 น.",
        },
      });
    }

    return {
      address: settings.address,
      phone: settings.phone,
      businessHours: settings.businessHours,
    };
  } catch (error) {
    console.error("Error getting shop settings:", error);
    return {
      address: "123/45 ถนนเจริญกรุง แขวงวังบูรพาภิรมย์ เขตพระนคร กรุงเทพฯ 10200",
      phone: "081-999-8888 (ฝ่ายบริการลูกค้า)",
      businessHours: "เปิดบริการทุกวัน 10:00 - 20:00 น.",
    };
  }
}

export async function updateShopSettingsAction(data: {
  address: string;
  phone: string;
  businessHours: string;
}) {
  try {
    await prisma.shopSetting.upsert({
      where: { id: "default" },
      update: {
        address: data.address.trim(),
        phone: data.phone.trim(),
        businessHours: data.businessHours.trim(),
      },
      create: {
        id: "default",
        address: data.address.trim(),
        phone: data.phone.trim(),
        businessHours: data.businessHours.trim(),
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error: any) {
    console.error("Update shop settings error:", error);
    return { success: false, error: error.message || "ไม่สามารถบันทึกข้อมูลตั้งค่าร้านได้" };
  }
}

