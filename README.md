# 🃏 ร้านสุภาพบุรุษ (Supapburut Card Games) - E-Commerce & Inventory Management Platform

ระบบร้านค้าออนไลน์และจัดการสต็อกการ์ดเกมเต็มรูปแบบ (E-Commerce & Smart Inventory Management System) พัฒนาขึ้นสำหรับ **ร้านสุภาพบุรุษ** ศูนย์รวมการ์ดเกมแท้ (Cardfight!! Vanguard, Future Card Buddyfight, Yu-Gi-Oh!, Battle Spirits และอุปกรณ์เสริม)

---

## 🌟 ฟีเจอร์หลักของระบบ (Key Features)

### 🛍️ หน้าร้านค้าสำหรับลูกค้า (Storefront)
- **การเลือกซื้อตามอัตราส่วนบรรจุ (Multi-Ratio Selection):** ลูกค้าสามารถเลือกซื้อสินค้าได้ตามความต้องการ ทั้งแบบ **ซองเดี่ยว (Single Pack)**, **กล่อง (Booster Box)** และ **ลัง (Carton Case)** พร้อมการคำนวณราคาและแสดงสต็อกเรียลไทม์
- **ค้นหาและกรองสินค้า (Search & Filter):** ค้นหาสินค้าตามชื่อ, รหัสสินค้า, ค่ายการ์ดเกม (Vanguard, Buddyfight, Yu-Gi-Oh!, Battle Spirits) หรือกรองเฉพาะสินค้า **Pre-Order**
- **ระบบชำระเงิน Dynamic PromptPay QR Code:** เจนเนอเรต QR Code ชำระเงิน PromptPay EMVCo ที่ตรงยอดเงินออเดอร์อัตโนมัติ ช่วยลดความผิดพลาดในการโอนเงิน
- **ระบบติดตามสถานะคำสั่งซื้อ (`/track`):** ลูกค้าสามารถค้นหาออเดอร์ด้วยหมายเลขคำสั่งซื้อ (Order Number) หรือเบอร์โทรศัพท์ เพื่อดูสถานะการตรวจสอบสลิปและเลขพัสดุ (Tracking Number)
- **ข้อมูลติดต่อหน้าร้านแบบไดนามิก:** แสดงที่อยู่ เบอร์โทร และเวลาเปิดบริการที่ Footer ดึงข้อมูลสดจากระบบหลังร้าน

### 👑 ระบบผู้ดูแลหลังร้าน (Admin Control Center)
- **ระบบเข้าสู่ระบบปลอดภัย (Protected Admin Auth):** ป้องกัน Route `/admin/*` ทั้งหมดด้วย `middleware.ts` และ HTTP-Only Cookie (`admin_session`) ต้องเข้าสู่ระบบผ่าน `/admin/login` เท่านั้น
- **แดชบอร์ดสรุปภาพรวม (`/admin/dashboard`):** สรุปยอดขายรวม, จำนวนสลิปที่รอตรวจสอบ, จำนวนสินค้าทั้งหมด และรายการคำสั่งซื้อล่าสุด
- **จัดการสินค้าและลายน้ำอัตโนมัติ (`/admin/products`):** เพิ่ม/แก้ไข/ลบ สินค้า, กำหนดอัตราส่วนลัง/กล่อง/ซอง และระบบประมวลผลลายน้ำภาพสินค้าอัตโนมัติด้วย **Sharp**
- **เครื่องคิดเลขรับของเข้าและคำนวณสต็อก (`/admin/inventory`):** คำนวณจำนวนสต็อกหน่วยฐาน (Base Units) จากการรับของเข้าแบบ ลัง + กล่อง + ซอง โดยอัตโนมัติ
- **ตรวจสอบสลิปและอนุมัติคำสั่งซื้อ (`/admin/orders`):** ตรวจสอบรูปภาพสลิปการโอนเงิน, อนุมัติการชำระเงิน, อัปเดตสถานะจัดส่ง/รับที่ร้าน และใส่เลขพัสดุติดตาม
- **จัดการข้อมูลร้านค้า (`/admin/settings`):** ฟอร์มสำหรับ Admin ในการแก้ไขที่อยู่หน้าร้าน, เบอร์โทรศัพท์ และเวลาเปิดบริการ สำหรับนำไปแสดงผลตรง Footer ของหน้าร้าน

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Core Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI:** [TailwindCSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Cart Store)
- **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/) (Watermarking Pipeline)
- **Payment Payload:** PromptPay EMVCo Payload & QRCode Generator

---

## 📂 โครงสร้างไดเรกทอรี (Project Structure)

```text
สุภาพบุรุษ/
├── prisma/
│   ├── schema.prisma       # Prisma Database Schema (User, Product, Variant, Order, ShopSetting)
│   ├── seed.ts             # Script สำหรับ Seed ข้อมูลทดสอบ
│   └── clean.ts            # Script สำหรับ ล้างข้อมูล Mockup
├── public/
│   ├── logos/              # โลโก้ร้านสุภาพบุรุษ
│   └── uploads/            # ไดเรกทอรีเก็บรูปภาพสินค้าและสลิปชำระเงิน
├── src/
│   ├── app/
│   │   ├── (storefront)/   # Route Group หน้าร้านค้า (Home, Products, Cart, Checkout, Track, Orders)
│   │   ├── admin/          # Route Group ระบบหลังร้าน (Login, Dashboard, Products, Inventory, Orders, Settings)
│   │   └── api/            # API Routes (Upload, Cron Cleanup)
│   ├── components/
│   │   ├── admin/          # Components สำหรับ Admin (Sidebar, Modals)
│   │   ├── storefront/     # Components สำหรับหน้าร้าน (Navbar, Footer, ProductCard, CartSheet)
│   │   └── ui/             # Reusable UI Elements
│   ├── lib/
│   │   ├── actions.ts      # Server Actions (Orders, Products, Auth, ShopSettings)
│   │   ├── prisma.ts       # Prisma Client Instance
│   │   ├── promptpay.ts    # PromptPay EMVCo QR Code Generator
│   │   ├── stock-calculator.ts # สูตรคำนวณสต็อกเชื่อมโยง ลัง/กล่อง/ซอง
│   │   └── watermark.ts    # Sharp Image Watermarking Pipeline
│   ├── store/
│   │   └── cart-store.ts   # Zustand Cart State
│   └── middleware.ts       # Protected Admin Route Middleware
├── package.json
└── README.md
```

---

## 🚀 ขั้นตอนการติดตั้งและการใช้งาน (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
- **Node.js**: v18.0.0 หรือใหม่กว่า
- **PostgreSQL Database**: มีการสร้างฐานข้อมูล PostgreSQL

### 2. คลองและติดตั้ง Dependencies
```bash
git clone https://github.com/10VE48TKU-KaCha/SBR_card.git
cd SBR_card
npm install
```

### 3. ตั้งค่า Environment Variables (`.env`)
สร้างไฟล์ `.env` ที่โฟลเดอร์ Root ของโปรเจกต์ และใส่ค่าการเชื่อมต่อฐานข้อมูล:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/supapburut_db?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. ซิงค์ฐานข้อมูล (Database Sync & Initialization)
```bash
# Push Schema ไปยังฐานข้อมูล PostgreSQL
npx prisma db push

# สั่ง Generate Prisma Client
npx prisma generate

# เคลียร์ข้อมูลตัวอย่างและสร้างบัญชี Admin เริ่มต้น
npx tsx prisma/clean.ts
```

### 5. เริ่มต้นตัวเซิร์ฟเวอร์สำหรับพัฒนา (Run Development Server)
```bash
npm run dev
```

เปิดบราวเซอร์และเข้าใช้งานที่ [http://localhost:3000](http://localhost:3000)

---

## 🔑 ข้อมูลเข้าสู่ระบบผู้ดูแลหลังร้านเริ่มต้น (Default Admin Account)

- **URL เข้าสู่ระบบ:** `http://localhost:3000/admin/login`
- **Email:** `admin@supapburut.com`
- **Password:** `admin123`

---

## 📜 ลิขสิทธิ์และการใช้งาน (License)

พัฒนาและปรับปรุงสำหรับ **ร้านสุภาพบุรุษ (Supapburut Card Games)**
