import { PrismaClient, GameFranchise, VariantType, Role, OrderStatus, FulfillmentType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Supapburut TCG Database...");

  // 1. Clean existing records safely
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@supapburut.com",
      name: "เถ้าแก่สุภาพบุรุษ (Admin)",
      role: Role.ADMIN,
      passwordHash: "admin_hashed_token_gentleman",
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: "staff@supapburut.com",
      name: "พนักงานดูแลสต็อก",
      role: Role.STAFF,
      passwordHash: "staff_hashed_token",
    },
  });

  const demoCustomer = await prisma.user.create({
    data: {
      email: "customer@example.com",
      name: "สมชาย รักการ์ดเกม",
      role: Role.CUSTOMER,
      passwordHash: "customer_hashed_token",
    },
  });

  console.log("👤 Created users: Admin, Staff, Customer");

  // 3. Create Products and Variants
  // Product 1: Cardfight!! Vanguard DZ-BT02 (In-Stock Booster)
  const p1 = await prisma.product.create({
    data: {
      code: "VG-DZ-BT02",
      name: "Cardfight!! Vanguard DZ-BT02: Illusions of the Crescent Moon",
      description: "บูสเตอร์ชุดใหม่ล่าสุดเสริมพลังทั้ง 6 เนชั่นหลัก มีโอกาสเปิดเจอการ์ดระดับ FFR, DSR และ Secret Rare ลายเซ็นพิเศษแท้จาก Bushiroad",
      franchise: GameFranchise.VANGUARD,
      images: [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
      ],
      isPreOrder: false,
      baseUnitName: "ซอง",
      packsPerBox: 16,
      boxesPerCarton: 16,
      baseStock: 512, // 2 Cartons = 32 Boxes = 512 Packs
      variants: {
        create: [
          {
            type: VariantType.SINGLE_PACK,
            name: "แบบซอง (Single Pack)",
            sku: "VG-DZ-BT02-PACK",
            price: 75.0,
            multiplier: 1,
          },
          {
            type: VariantType.BOOSTER_BOX,
            name: "แบบกล่อง (Booster Box - 16 ซอง)",
            sku: "VG-DZ-BT02-BOX",
            price: 1100.0,
            multiplier: 16,
          },
          {
            type: VariantType.CARTON_CASE,
            name: "แบบลัง (Carton Case - 16 กล่อง)",
            sku: "VG-DZ-BT02-CARTON",
            price: 16800.0,
            multiplier: 256,
          },
        ],
      },
    },
  });

  // Product 2: Cardfight!! Vanguard DZ-BT03 (Pre-Order)
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 25);

  const p2 = await prisma.product.create({
    data: {
      code: "VG-DZ-BT03",
      name: "[Pre-Order] Cardfight!! Vanguard DZ-BT03: Dimensional Clash",
      description: "สั่งจองล่วงหน้าราคาพิเศษ! พร้อมรับโปรโมการ์ดพิเศษหน้าร้าน 1 ใบต่อทุกๆ การสั่งซื้อแบบกล่อง สินค้าพร้อมส่ง/รับหน้าร้านในวันวางจำหน่ายอย่างเป็นทางการ",
      franchise: GameFranchise.VANGUARD,
      images: [
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
      ],
      isPreOrder: true,
      releaseDate: nextMonth,
      baseUnitName: "ซอง",
      packsPerBox: 16,
      boxesPerCarton: 16,
      baseStock: 256, // 1 Carton quota
      variants: {
        create: [
          {
            type: VariantType.BOOSTER_BOX,
            name: "แบบกล่องพรีออเดอร์ (Booster Box)",
            sku: "VG-DZ-BT03-BOX-PRE",
            price: 1050.0,
            multiplier: 16,
          },
          {
            type: VariantType.CARTON_CASE,
            name: "แบบลังพรีออเดอร์ (Carton Case)",
            sku: "VG-DZ-BT03-CARTON-PRE",
            price: 16000.0,
            multiplier: 256,
          },
        ],
      },
    },
  });

  // Product 3: Yu-Gi-Oh! Rarity Collection II
  const p3 = await prisma.product.create({
    data: {
      code: "YGO-RA02",
      name: "Yu-Gi-Oh! 25th Anniversary Rarity Collection II (TCG/OCG)",
      description: "สุดยอดกล่องรวมแรร์แห่งศตวรรษ การันตีฟอยล์ทุกซองและมีโอกาสได้ Quarter Century Secret Rare สวยงามระดับสะสม",
      franchise: GameFranchise.YUGIOH,
      images: [
        "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
      ],
      isPreOrder: false,
      baseUnitName: "ซอง",
      packsPerBox: 24,
      boxesPerCarton: 12,
      baseStock: 576, // 2 Cartons = 24 Boxes = 576 Packs
      variants: {
        create: [
          {
            type: VariantType.SINGLE_PACK,
            name: "แบบซอง (Single Pack)",
            sku: "YGO-RA02-PACK",
            price: 160.0,
            multiplier: 1,
          },
          {
            type: VariantType.BOOSTER_BOX,
            name: "แบบกล่อง (Booster Box - 24 ซอง)",
            sku: "YGO-RA02-BOX",
            price: 3600.0,
            multiplier: 24,
          },
          {
            type: VariantType.CARTON_CASE,
            name: "แบบลัง (Carton Case - 12 กล่อง)",
            sku: "YGO-RA02-CARTON",
            price: 42000.0,
            multiplier: 288,
          },
        ],
      },
    },
  });

  // Product 4: Future Card Buddyfight Ace Booster
  const p4 = await prisma.product.create({
    data: {
      code: "BF-S-UB03",
      name: "Future Card Buddyfight S-UB03: Ultimate Booster Cross",
      description: "การ์ดเกมบัดดี้ไฟท์แท้ลิขสิทธิ์ รวมพลังมังกรและฮีโร่สุดแกร่ง บูสเตอร์ยอดนิยมสำหรับผู้เล่นระดับแข่งขัน",
      franchise: GameFranchise.BUDDYFIGHT,
      images: [
        "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
      ],
      isPreOrder: false,
      baseUnitName: "ซอง",
      packsPerBox: 16,
      boxesPerCarton: 16,
      baseStock: 320, // 20 Boxes = 320 Packs
      variants: {
        create: [
          {
            type: VariantType.SINGLE_PACK,
            name: "แบบซอง (Single Pack)",
            sku: "BF-S-UB03-PACK",
            price: 65.0,
            multiplier: 1,
          },
          {
            type: VariantType.BOOSTER_BOX,
            name: "แบบกล่อง (Booster Box - 16 ซอง)",
            sku: "BF-S-UB03-BOX",
            price: 950.0,
            multiplier: 16,
          },
          {
            type: VariantType.CARTON_CASE,
            name: "แบบลัง (Carton Case - 16 กล่อง)",
            sku: "BF-S-UB03-CARTON",
            price: 14800.0,
            multiplier: 256,
          },
        ],
      },
    },
  });

  // Product 5: Battle Spirits Contract Booster
  const p5 = await prisma.product.create({
    data: {
      code: "BS-CB28",
      name: "Battle Spirits Collaboration Booster CB28: Gundam Witch from Mercury",
      description: "แบทเทิลสปิริตส์ชุดโคลาโบกันดั้ม แม่มดจากดาวพุธ การ์ดแท้ญี่ปุ่น พลังแห่ง Aerial Rebuild และ Calibarn",
      franchise: GameFranchise.BATTLE_SPIRITS,
      images: [
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
      ],
      isPreOrder: false,
      baseUnitName: "ซอง",
      packsPerBox: 20,
      boxesPerCarton: 12,
      baseStock: 480, // 2 Cartons = 24 Boxes = 480 Packs
      variants: {
        create: [
          {
            type: VariantType.SINGLE_PACK,
            name: "แบบซอง (Single Pack)",
            sku: "BS-CB28-PACK",
            price: 90.0,
            multiplier: 1,
          },
          {
            type: VariantType.BOOSTER_BOX,
            name: "แบบกล่อง (Booster Box - 20 ซอง)",
            sku: "BS-CB28-BOX",
            price: 1650.0,
            multiplier: 20,
          },
          {
            type: VariantType.CARTON_CASE,
            name: "แบบลัง (Carton Case - 12 กล่อง)",
            sku: "BS-CB28-CARTON",
            price: 19000.0,
            multiplier: 240,
          },
        ],
      },
    },
  });

  // Product 6: Starter Deck Vanguard Quick Start
  const p6 = await prisma.product.create({
    data: {
      code: "VG-DZ-SD01",
      name: "Cardfight!! Vanguard DZ-SD01: Quick Start Deck Dragon Empire",
      description: "ชุดการ์ดเริ่มต้นพร้อมเล่นทันที 50 ใบ สำหรับผู้เล่นใหม่ มาพร้อมคู่มือและสนามกระดาษ",
      franchise: GameFranchise.VANGUARD,
      images: [
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
      ],
      isPreOrder: false,
      baseUnitName: "กล่องเด็ค",
      packsPerBox: 1,
      boxesPerCarton: 8,
      baseStock: 40,
      variants: {
        create: [
          {
            type: VariantType.STARTER_DECK,
            name: "กล่องพร้อมเล่น (Starter Deck)",
            sku: "VG-DZ-SD01-DECK",
            price: 199.0,
            multiplier: 1,
          },
          {
            type: VariantType.CARTON_CASE,
            name: "ลังเด็ค (Carton Case - 8 กล่อง)",
            sku: "VG-DZ-SD01-CARTON",
            price: 1500.0,
            multiplier: 8,
          },
        ],
      },
    },
  });

  // Product 7: Gentleman Shop 50th Anniversary Limited Sleeves
  const p7 = await prisma.product.create({
    data: {
      code: "SP-SLV-50TH",
      name: "ร้านสุภาพบุรุษ ซองใส่การ์ดรุ่นพิเศษ ฉลองครบรอบ 50 ปี (50th Anniversary Matte Sleeves 70ct)",
      description: "ซองใส่การ์ดพรีเมียมลิขสิทธิ์แท้ร้านสุภาพบุรุษ ผิวสัมผัสแบบ Matte Shuffle Feel ลื่นมือ ทนทาน ไม่สะท้อนแสง พร้อมโลโก้ทองปั๊มฟอยล์หรูหรา",
      franchise: GameFranchise.OTHER,
      images: [
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
      ],
      isPreOrder: false,
      baseUnitName: "แพ็ค",
      packsPerBox: 10,
      boxesPerCarton: 10,
      baseStock: 200,
      variants: {
        create: [
          {
            type: VariantType.SPECIAL_SET,
            name: "ซองการ์ด 1 แพ็ค (70 ซอง)",
            sku: "SP-SLV-50TH-SINGLE",
            price: 290.0,
            multiplier: 1,
          },
          {
            type: VariantType.BOOSTER_BOX,
            name: "กล่องยกแพ็ค (10 แพ็ค)",
            sku: "SP-SLV-50TH-BOX",
            price: 2700.0,
            multiplier: 10,
          },
        ],
      },
    },
  });

  // Product 8: Gentleman Magnetic Obsidian Deck Box
  const p8 = await prisma.product.create({
    data: {
      code: "SP-DECK-BOX-GOLD",
      name: "กล่องใส่การ์ดหนังแท้ฝาแม่เหล็ก Obsidian Gold รุ่นสุภาพบุรุษ (100+ Double Sleeved)",
      description: "กล่องหนังพรีเมียมบุผ้ากำมะหยี่ด้านใน ล็อคแน่นด้วยแม่เหล็กพลังสูง 4 จุด จุการ์ดใส่ซองสองชั้นได้เกิน 100 ใบ เหมาะสำหรับการ์ดสะสมมูลค่าสูง",
      franchise: GameFranchise.OTHER,
      images: [
        "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80",
      ],
      isPreOrder: false,
      baseUnitName: "ชิ้น",
      packsPerBox: 1,
      boxesPerCarton: 20,
      baseStock: 50,
      variants: {
        create: [
          {
            type: VariantType.SPECIAL_SET,
            name: "กล่องใส่การ์ด 1 ชิ้น",
            sku: "SP-DECK-BOX-1",
            price: 490.0,
            multiplier: 1,
          },
        ],
      },
    },
  });

  console.log("🎴 Created 8 TCG products with full variants and packaging ratios");

  // 4. Create Sample Orders to show tracking and verification capabilities
  const v1 = await prisma.productVariant.findUnique({ where: { sku: "VG-DZ-BT02-BOX" } });
  const v2 = await prisma.productVariant.findUnique({ where: { sku: "SP-SLV-50TH-SINGLE" } });

  if (v1 && v2) {
    // Sample Order 1: Pending Verification with Slip
    const exp1 = new Date();
    exp1.setMinutes(exp1.getMinutes() + 12);

    await prisma.order.create({
      data: {
        orderNumber: "SP-20260818-0001",
        userId: demoCustomer.id,
        customerName: "สมชาย รักการ์ดเกม",
        customerPhone: "089-123-4567",
        customerEmail: "somchai.tcg@gmail.com",
        shippingAddress: "99/12 อาคารการ์ดทาวเวอร์ ชั้น 4 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กทม. 10900",
        fulfillmentType: FulfillmentType.DELIVERY,
        status: OrderStatus.PENDING_VERIFICATION,
        totalAmount: 1440.0,
        shippingFee: 50.0,
        paymentSlipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        expiresAt: exp1,
        items: {
          create: [
            {
              variantId: v1.id,
              quantity: 1,
              unitPrice: 1100.0,
              deductedBaseUnits: 16,
            },
            {
              variantId: v2.id,
              quantity: 1,
              unitPrice: 290.0,
              deductedBaseUnits: 1,
            },
          ],
        },
      },
    });

    // Sample Order 2: Store Pickup - Paid & Ready for Pickup
    const exp2 = new Date();
    exp2.setDate(exp2.getDate() - 1);

    await prisma.order.create({
      data: {
        orderNumber: "SP-20260818-0002",
        customerName: "ธนากร นักแข่งแวนการ์ด",
        customerPhone: "081-444-5555",
        customerEmail: "tanakorn.vanguard@gmail.com",
        shippingAddress: null,
        fulfillmentType: FulfillmentType.STORE_PICKUP,
        status: OrderStatus.READY_FOR_PICKUP,
        totalAmount: 1100.0,
        shippingFee: 0.0,
        paidAt: new Date(),
        expiresAt: exp2,
        items: {
          create: [
            {
              variantId: v1.id,
              quantity: 1,
              unitPrice: 1100.0,
              deductedBaseUnits: 16,
            },
          ],
        },
      },
    });

    // Sample Order 3: Shipped with Tracking Number
    await prisma.order.create({
      data: {
        orderNumber: "SP-20260818-0003",
        customerName: "วิชัย สะสมการ์ดยูกิ",
        customerPhone: "086-789-0123",
        customerEmail: "wichai.yugioh@gmail.com",
        shippingAddress: "456 หมู่บ้านทองคำ ซอย 8 ถ.สุขุมวิท กทม. 10110",
        fulfillmentType: FulfillmentType.DELIVERY,
        status: OrderStatus.SHIPPED,
        totalAmount: 1150.0,
        shippingFee: 50.0,
        paidAt: new Date(),
        expiresAt: exp2,
        trackingNumber: "TH01928374659B",
        items: {
          create: [
            {
              variantId: v1.id,
              quantity: 1,
              unitPrice: 1100.0,
              deductedBaseUnits: 16,
            },
          ],
        },
      },
    });
    console.log("📦 Created 3 initial orders (Pending Verification, Ready for Pickup, Shipped)");
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
