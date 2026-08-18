import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all mockup data from Supapburut TCG Database...");

  // 1. Clean existing records safely
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany({
    where: {
      role: Role.CUSTOMER,
    },
  });

  console.log("✅ All mock orders, order items, products, variants, and customer accounts removed!");

  // 2. Ensure Admin User exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: "admin@supapburut.com",
        name: "เถ้าแก่สุภาพบุรุษ (Admin)",
        role: Role.ADMIN,
        passwordHash: "admin123",
      },
    });
    console.log("👤 Default Admin account created (admin@supapburut.com)");
  } else {
    console.log("👤 Admin account preserved");
  }

  // 3. Ensure default ShopSetting exists
  await prisma.shopSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      address: "123/45 ถนนเจริญกรุง แขวงวังบูรพาภิรมย์ เขตพระนคร กรุงเทพฯ 10200",
      phone: "081-999-8888 (ฝ่ายบริการลูกค้า)",
      businessHours: "เปิดบริการทุกวัน 10:00 - 20:00 น.",
    },
  });
  console.log("⚙️ Default ShopSetting initialized");

  console.log("🎉 Database cleanup complete! Clean state ready for production usage.");
}

main()
  .catch((e) => {
    console.error("❌ Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
