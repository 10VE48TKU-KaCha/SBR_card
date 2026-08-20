"use server";

import prisma from "@/lib/prisma";
import { CardLanguage, FulfillmentType, GameFranchise, OrderStatus, VariantType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateDynamicPromptPayQR } from "./promptpay";
import { calculateStockIntake } from "./stock-calculator";
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
  setCustomerSessionCookie,
  clearCustomerSessionCookie,
  SafeUser,
} from "./auth";
import { cleanPhoneNumber, isValidThaiPhone } from "./utils";

export interface CheckoutInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: FulfillmentType;
  shippingAddress?: string;
  saveAddressToProfile?: boolean;
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ เพื่อให้สามารถติดตามคำสั่งซื้อได้",
        requireAuth: true,
      };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "ไม่มีสินค้าในตะกร้า" };
    }

    const cleanPhone = cleanPhoneNumber(input.customerPhone);
    if (!cleanPhone || !isValidThaiPhone(cleanPhone)) {
      return {
        success: false,
        error: "กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง (เฉพาะตัวเลข 9-10 หลัก เช่น 0812345678)",
      };
    }

    if (!input.customerName || input.customerName.trim().length < 2) {
      return { success: false, error: "กรุณาระบุชื่อ-นามสกุลของผู้รับสินค้า" };
    }

    if (input.fulfillmentType === FulfillmentType.DELIVERY && (!input.shippingAddress || !input.shippingAddress.trim())) {
      return { success: false, error: "กรุณาระบุที่อยู่จัดส่งสำหรับบริการจัดส่งพัสดุ" };
    }

    // Optionally save new address/phone back to user's profile
    if (input.saveAddressToProfile && input.fulfillmentType === FulfillmentType.DELIVERY && input.shippingAddress) {
      try {
        await prisma.user.update({
          where: { id: currentUser.id },
          data: {
            phone: cleanPhone,
            address: input.shippingAddress.trim(),
            name: input.customerName.trim(),
          },
        });
      } catch (err) {
        console.error("Failed to save address to profile:", err);
      }
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

      // 2. Create Order linked to authenticated User
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: currentUser.id,
          customerName: input.customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: input.customerEmail?.trim() || currentUser.email,
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
  isSingleCard?: boolean;
  cardNumber?: string | null;
  rarity?: string | null;
  cardLanguage?: CardLanguage | null;
  clanNation?: string | null;
  cardType?: string | null;
  foilType?: string | null;
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
    const isSingleCard = Boolean(productData.isSingleCard);
    const baseUnitName = isSingleCard ? "ใบ" : (productData.baseUnitName || "ซอง");

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
            baseUnitName,
            packsPerBox: isSingleCard ? 1 : productData.packsPerBox,
            boxesPerCarton: isSingleCard ? 1 : productData.boxesPerCarton,
            baseStock: productData.baseStock,
            isSingleCard,
            cardNumber: productData.cardNumber?.trim() || null,
            rarity: productData.rarity?.trim() || null,
            cardLanguage: productData.cardLanguage || CardLanguage.TH,
            clanNation: productData.clanNation?.trim() || null,
            cardType: productData.cardType?.trim() || null,
            foilType: productData.foilType?.trim() || null,
          },
        });

        // Delete variants that are no longer in productData.variants
        const activeTypes = productData.variants.map((v) => v.type);
        await tx.productVariant.deleteMany({
          where: {
            productId: productData.id,
            type: { notIn: activeTypes },
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
          baseUnitName,
          packsPerBox: isSingleCard ? 1 : productData.packsPerBox,
          boxesPerCarton: isSingleCard ? 1 : productData.boxesPerCarton,
          baseStock: productData.baseStock,
          isSingleCard,
          cardNumber: productData.cardNumber?.trim() || null,
          rarity: productData.rarity?.trim() || null,
          cardLanguage: productData.cardLanguage || CardLanguage.TH,
          clanNation: productData.clanNation?.trim() || null,
          cardType: productData.cardType?.trim() || null,
          foilType: productData.foilType?.trim() || null,
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

/**
 * Customer Authentication & Profile Server Actions
 */

export async function registerCustomerAction(data: {
  name: string;
  phone: string;
  email: string;
  password: string;
  address?: string;
}) {
  try {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const rawPhone = data.phone.trim();
    const phone = cleanPhoneNumber(rawPhone);
    const password = data.password.trim();
    const address = data.address?.trim() || null;

    if (!name || name.length < 2) {
      return { success: false, error: "กรุณาระบุชื่อ-นามสกุลให้ถูกต้อง (อย่างน้อย 2 ตัวอักษร)" };
    }

    if (!phone || !isValidThaiPhone(phone)) {
      return {
        success: false,
        error: "กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง (เฉพาะตัวเลข 9-10 หลัก เช่น 0812345678)",
      };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "กรุณาระบุรูปแบบอีเมลให้ถูกต้อง" };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" };
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ" };
    }

    // Hash password securely
    const passwordHash = hashPassword(password);

    // Create customer account
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        address,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    // Set session cookie
    await setCustomerSessionCookie(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง" };
  }
}

export async function loginCustomerAction(emailInput: string, passwordInput: string) {
  try {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!email || !password) {
      return { success: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    // Set session cookie
    await setCustomerSessionCookie(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    };
  } catch (error: any) {
    console.error("Customer login error:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
  }
}

export async function logoutCustomerAction() {
  try {
    await clearCustomerSessionCookie();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการออกจากระบบ" };
  }
}

export async function getCurrentUserAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: true, user: null };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Get current user error:", error);
    return { success: false, user: null };
  }
}

export async function updateCustomerProfileAction(data: {
  name: string;
  phone: string;
  address?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
    }

    const name = data.name.trim();
    const phone = cleanPhoneNumber(data.phone);
    const address = data.address?.trim() || null;

    if (!name || name.length < 2) {
      return { success: false, error: "กรุณาระบุชื่อ-นามสกุลให้ถูกต้อง (อย่างน้อย 2 ตัวอักษร)" };
    }

    if (phone && !isValidThaiPhone(phone)) {
      return {
        success: false,
        error: "กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง (เฉพาะตัวเลข 9-10 หลัก เช่น 0812345678)",
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        phone: phone || null,
        address,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/checkout");

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
      },
    };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลโปรไฟล์" };
  }
}

export async function changeCustomerPasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "ไม่พบข้อมูลบัญชีผู้ใช้" };
    }

    const isMatch = verifyPassword(data.currentPassword.trim(), user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
    }

    if (!data.newPassword || data.newPassword.trim().length < 6) {
      return { success: false, error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" };
    }

    const newHash = hashPassword(data.newPassword.trim());

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Change password error:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" };
  }
}

export async function getCustomerOrdersAction() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "กรุณาเข้าสู่ระบบเพื่อดูประวัติคำสั่งซื้อ", orders: [] };
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          ...(currentUser.email ? [{ customerEmail: currentUser.email }] : []),
          ...(currentUser.phone ? [{ customerPhone: currentUser.phone }] : []),
        ],
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const serializedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      fulfillmentType: order.fulfillmentType,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      shippingFee: Number(order.shippingFee),
      paymentSlipUrl: order.paymentSlipUrl,
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      expiresAt: order.expiresAt.toISOString(),
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        deductedBaseUnits: item.deductedBaseUnits,
        variant: {
          id: item.variant.id,
          name: item.variant.name,
          type: item.variant.type,
          sku: item.variant.sku,
          price: Number(item.variant.price),
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            code: item.variant.product.code,
            images: item.variant.product.images,
            franchise: item.variant.product.franchise,
          },
        },
      })),
    }));

    return { success: true, orders: serializedOrders };
  } catch (error: any) {
    console.error("Get customer orders error:", error);
    return { success: false, error: error.message || "ไม่สามารถดึงข้อมูลประวัติคำสั่งซื้อได้", orders: [] };
  }
}


