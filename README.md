# 🃏 ร้านสุภาพบุรุษ (Supapburut Card Games) - E-Commerce & Inventory Management Platform

ระบบร้านค้าออนไลน์และจัดการสต็อกการ์ดเกมเต็มรูปแบบ (E-Commerce & Smart Inventory Management System) พัฒนาขึ้นสำหรับ **ร้านสุภาพบุรุษ** ศูนย์รวมการ์ดเกมแท้ (Cardfight!! Vanguard, Future Card Buddyfight, Yu-Gi-Oh!, Battle Spirits และอุปกรณ์เสริมพรีเมียม)

---

## 🌟 ฟีเจอร์หลักของระบบ (Key Features)

### 👤 ระบบสมาชิก & โปรไฟล์ผู้ใช้งาน (Customer Authentication & Profile)
- **ระบบสมัครสมาชิก (`/register`) & เข้าสู่ระบบ (`/login`):**
  - สมัครสมาชิกด้วย ชื่อ-นามสกุล, เบอร์โทรศัพท์ (บังคับเฉพาะตัวเลข), อีเมล, รหัสผ่าน, และที่อยู่จัดส่งเริ่มต้น
  - มี **ปุ่มเปิด-ปิดการแสดงรหัสผ่าน (Show/Hide Password Eye Toggle)** ในทุกหน้าฟอร์มรหัสผ่าน
  - เข้ารหัสผ่านความปลอดภัยสูงด้วย **PBKDF2 Salted Hashing** (ไม่มีการเก็บรหัสผ่าน Plaintext)
  - จัดการ Session ด้วย **HTTP-Only Secure Cookie** ป้องกันการถูกดักจับข้อมูล
- **ระบบบังคับเข้าสู่ระบบก่อนสั่งซื้อ (Auth Required on Checkout):**
  - ตรวจสอบสถานะการเข้าสู่ระบบก่อนดำเนินการชำระเงิน หากยังไม่ได้ล็อกอิน ระบบจะส่งไปยังหน้าเข้าสู่ระบบพร้อมพารามิเตอร์ `?redirect=/checkout` โดยสินค้าในตะกร้าไม่สูญหาย
  - ผูก `userId` ของลูกค้าเข้ากับคำสั่งซื้อโดยอัตโนมัติ เพื่อให้สามารถติดตามสถานะในบัญชีได้ตลอดเวลา
- **หน้าโปรไฟล์ & จัดการที่อยู่จัดส่ง (`/profile`):**
  - จัดการข้อมูลส่วนตัว (ชื่อ-นามสกุล, เบอร์โทรศัพท์, อีเมล)
  - กำหนด **ที่อยู่จัดส่งพัสดุเริ่มต้น (Default Shipping Address)**
  - ระบบ **เปลี่ยนรหัสผ่าน (Change Password)** ที่ปลอดภัย
- **ดึงข้อมูลโปรไฟล์มาใส่ในหน้าสั่งซื้ออัตโนมัติ (Auto-fill on Checkout):**
  - เมื่อเข้าหน้าชำระเงิน ระบบจะดึงชื่อ เบอร์โทร อีเมล และที่อยู่จัดส่งจากโปรไฟล์มาใส่ให้อัตโนมัติ
  - รองรับการแก้ไขที่อยู่เฉพาะคำสั่งซื้อนั้น พร้อม Checkbox *"บันทึกที่อยู่นี้เป็นที่อยู่เริ่มต้นในโปรไฟล์"*
- **หน้าประวัติคำสั่งซื้อและติดตามสถานะ (`/profile?tab=orders` หรือ `/orders`):**
  - แสดงรายการคำสั่งซื้อทั้งหมดของลูกค้า เรียงลำดับจากล่าสุด
  - แสดงสถานะออเดอร์ด้วยป้ายสีชัดเจน (รอชำระเงิน, รอตรวจสลิป, เตรียมสินค้า, พร้อมรับที่ร้าน, จัดส่งแล้ว)
  - ทางลัดเปิด PromptPay QR / แนบสลิปชำระเงินสำหรับออเดอร์ที่ค้างชำระ
  - ปุ่ม **คัดลอกหมายเลขพัสดุ (Copy Tracking Number)** พร้อมปุ่มลิงก์เช็คสถานะพัสดุไปยังบริษัทขนส่งโดยตรง

---

### 🛍️ หน้าร้านค้าสำหรับลูกค้า (Storefront Experience)
- **การจำกัดเบอร์โทรศัพท์เป็นตัวเลขเท่านั้น (Digits Only Input):**
  - ระบบกรองตัวอักษรและอักขระพิเศษออกอัตโนมัติทั้งตอนพิมพ์และวางข้อความ (Paste) ให้เหลือเฉพาะตัวเลข 9-10 หลักตามมาตรฐานเบอร์โทรศัพท์ไทย
- **การเลือกซื้อตามอัตราส่วนบรรจุ (Multi-Ratio Packaging):**
  - เลือกระดับการสั่งซื้อได้ทั้งแบบ **ซองเดี่ยว (Single Pack)**, **กล่อง (Booster Box)** และ **ลัง (Carton Case)** พร้อมคำนวณราคาและแสดงสต็อกสัมพันธ์กันเรียลไทม์
- **ระบบค้นหาและตัวกรองอัจฉริยะ (Search & Filter):**
  - ค้นหาตามชื่อการ์ด, รหัสสินค้า (เช่น `VG-DZ-BT02`), ค่ายการ์ดเกม (Vanguard, Buddyfight, Yu-Gi-Oh!, Battle Spirits) หรือกรองเฉพาะสินค้าสั่งจอง **Pre-Order**
- **ระบบชำระเงิน Dynamic PromptPay QR Code:**
  - สร้าง QR Code พร้อมเพย์ตามมาตรฐาน EMVCo ที่มียอดเงินตรงตามเศษสตางค์ของออเดอร์ทันที พร้อมล็อคสต็อกสินค้า 15 นาที
- **ระบบแนบสลิปโอนเงิน (Payment Slip Upload):**
  - ลูกค้าสามารถอัปโหลดรูปภาพสลิปโอนเงิน เพื่อให้ทีมงานหลังร้านตรวจสอบและอนุมัติออเดอร์
- **เมนูนำทาง Navbar อัจฉริยะ:**
  - แสดงปุ่มเข้าสู่ระบบเมื่อยังไม่ได้ล็อกอิน และแสดง **User Avatar Dropdown** (ชื่อผู้ใช้, โปรไฟล์, ประวัติคำสั่งซื้อ, ออกจากระบบ) เมื่อล็อกอินแล้ว

---

### 👑 ระบบจัดการสำหรับผู้ดูแลร้าน (Admin Control Center)
- **ระบบรักษาความปลอดภัยหลังร้าน (Protected Admin Auth):**
  - ป้องกัน Route `/admin/*` ทั้งหมดด้วย `middleware.ts` และ Session Cookie ต้องล็อกอินผ่าน `/admin/login`
- **แดชบอร์ดสรุปภาพรวม (`/admin/dashboard`):**
  - แสดงยอดขายรวม, จำนวนออเดอร์รอตรวจสอบสลิป, จำนวนสินค้าทั้งหมด และรายการคำสั่งซื้อล่าสุด
- **จัดการสินค้าและใส่ลายน้ำอัตโนมัติ (`/admin/products`):**
  - เพิ่ม/แก้ไข/ลบ สินค้า, กำหนดอัตราส่วนลัง/กล่อง/ซอง และระบบประมวลผลลายน้ำภาพสินค้าอัตโนมัติด้วย **Sharp**
- **เครื่องคิดเลขรับของเข้าและคำนวณสต็อก (`/admin/inventory`):**
  - คำนวณจำนวนสต็อกหน่วยฐาน (Base Units) จากการรับของเข้าแบบ ลัง + กล่อง + ซอง อัตโนมัติ
- **ตรวจสอบสลิปและจัดการคำสั่งซื้อ (`/admin/orders`):**
  - ตรวจสอบรูปภาพสลิปโอนเงิน, อนุมัติการชำระเงิน, ปรับสถานะจัดส่ง/รับที่ร้าน และระบุหมายเลขพัสดุ (Tracking Number)
- **จัดการข้อมูลร้านค้า (`/admin/settings`):**
  - แก้ไขที่อยู่หน้าร้าน, เบอร์โทรศัพท์ และเวลาเปิดบริการ นำไปแสดงผลตรง Footer หน้าร้านแบบเรียลไทม์

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนประกอบ (Component) | เทคโนโลยี (Technology) |
|---|---|
| **Core Framework** | [Next.js 15](https://nextjs.org/) (App Router, React 19, Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling & Design** | [TailwindCSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM v6](https://www.prisma.io/) |
| **Security & Auth** | Node.js Crypto (PBKDF2 Salted Hashing), HMAC Signed Session Tokens, HTTP-Only Cookies |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) (Cart Store) |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) (Watermarking Engine) |
| **Payment Payload** | PromptPay EMVCo Payload & QRCode Generator |

---

## 📂 โครงสร้างไดเรกทอรี (Project Structure)

```text
สุภาพบุรุษ/
├── prisma/
│   ├── schema.prisma       # Prisma Schema (User with phone/address, Product, Variant, Order, ShopSetting)
│   └── seed.ts             # Script สำหรับ Seed ข้อมูลสินค้าและผู้ใช้ทดสอบ
├── public/
│   ├── logos/              # โลโก้ร้านสุภาพบุรุษ
│   └── uploads/            # ไดเรกทอรีเก็บรูปภาพสินค้าและสลิปชำระเงิน
├── src/
│   ├── app/
│   │   ├── (storefront)/   # Route Group หน้าร้านค้า
│   │   │   ├── page.tsx            # หน้าแรก (Hero, Franchise Highlights, Pre-Orders, New Releases)
│   │   │   ├── products/           # แคตตาล็อกสินค้า & หน้ารายละเอียดสินค้า
│   │   │   ├── cart/               # หน้ารวมตะกร้าสินค้า
│   │   │   ├── checkout/           # หน้าชำระเงิน (Auth check, Auto-fill, Numeric phone)
│   │   │   ├── login/              # หน้าเข้าสู่ระบบลูกค้า (Show/Hide Password, Redirect)
│   │   │   ├── register/           # หน้าสมัครสมาชิกใหม่ (Numeric phone, Password confirm)
│   │   │   ├── profile/            # หน้าโปรไฟล์ จัดการที่อยู่ เปลี่ยนรหัสผ่าน และประวัติคำสั่งซื้อ
│   │   │   ├── orders/             # Redirect ไปยังประวัติคำสั่งซื้อในโปรไฟล์
│   │   │   └── track/              # หน้าตรวจสอบสถานะคำสั่งซื้อทั่วไป
│   │   ├── admin/          # Route Group ระบบผู้ดูแลร้าน
│   │   │   ├── login/              # หน้าเข้าสู่ระบบ Admin
│   │   │   ├── dashboard/          # แดชบอร์ดสรุปยอดขายและสถิติ
│   │   │   ├── products/           # จัดการแคตตาล็อกสินค้าและรูปภาพ
│   │   │   ├── inventory/          # ระบบคำนวณรับของเข้าและจัดการสต็อก
│   │   │   ├── orders/             # ตรวจสอบสลิปและจัดการสถานะออเดอร์
│   │   │   └── settings/           # ตั้งค่าที่อยู่และเบอร์โทรหน้าร้าน
│   │   └── api/            # API Routes (Upload, Cron Cleanup)
│   ├── components/
│   │   ├── admin/          # Admin Components (Sidebar, Modals, SlipViewer)
│   │   ├── storefront/     # Storefront Components (Navbar with User Menu, Footer, ProductCard, CartSheet)
│   │   └── ui/             # Reusable UI Elements
│   ├── lib/
│   │   ├── actions.ts      # Server Actions (Auth, Profile, Orders, Products, Settings)
│   │   ├── auth.ts         # Authentication Core (PBKDF2 Hashing, Session Tokens, Cookie Handlers)
│   │   ├── prisma.ts       # Prisma Client Instance
│   │   ├── promptpay.ts    # PromptPay EMVCo QR Code Generator
│   │   ├── stock-calculator.ts # สูตรคำนวณสต็อกเชื่อมโยง ลัง/กล่อง/ซอง
│   │   ├── utils.ts        # ฟังก์ชัน Utility (Phone Sanitation, Currency, Order Status)
│   │   └── watermark.ts    # Sharp Image Watermarking Pipeline
│   ├── store/
│   │   └── cart-store.ts   # Zustand Cart State
│   └── middleware.ts       # Protected Route Middleware
├── package.json
└── README.md
```

---

## 🚀 ขั้นตอนการติดตั้งและการใช้งาน (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
- **Node.js**: v18.0.0 หรือใหม่กว่า
- **PostgreSQL Database**: มีการติดตั้งและสร้างฐานข้อมูล PostgreSQL

### 2. โคลนโปรเจกต์และติดตั้ง Dependencies
```bash
git clone https://github.com/10VE48TKU-KaCha/SBR_card.git
cd SBR_card
npm install
```

### 3. ตั้งค่า Environment Variables (`.env`)
สร้างไฟล์ `.env` ที่โฟลเดอร์ Root ของโปรเจกต์:
```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/supapburut_db?schema=public"

# PromptPay Store Settings
NEXT_PUBLIC_PROMPTPAY_NUMBER="0819998888"
NEXT_PUBLIC_SHOP_NAME="ร้านสุภาพบุรุษ (Supapburut Toys & Card Games)"
NEXT_PUBLIC_SHOP_ADDRESS="123/45 ถนนเจริญกรุง แขวงวังบูรพาภิรมย์ เขตพระนคร กรุงเทพมหานคร 10200"
NEXT_PUBLIC_SHOP_PHONE="081-999-8888"

# Auth Session Secret
AUTH_SECRET="supapburut_secret_customer_session_token_key_2026"

# Cron secret for cleanup-orders endpoint
CRON_SECRET="supapburut_cron_secure_key_2026"
```

### 4. ซิงค์ฐานข้อมูลและ Seed ข้อมูลตัวอย่าง (Database Sync & Seed)
```bash
# Push Schema ไปยังฐานข้อมูล PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed ข้อมูลสินค้าตัวอย่างและผู้ใช้งานเริ่มต้น
npm run prisma:seed
```

### 5. เริ่มต้นตัวเซิร์ฟเวอร์สำหรับพัฒนา (Run Development Server)
```bash
npm run dev
```

เปิดบราวเซอร์และเข้าใช้งานที่ [http://localhost:3000](http://localhost:3000)

### 6. การทดสอบ Build ระบบสำหรับ Production (Production Build)
```bash
npm run build
npm start
```

---

## 🔑 บัญชีผู้ใช้งานเริ่มต้นสำหรับทดสอบระบบ (Default Test Accounts)

### 👑 บัญชีผู้ดูแลหลังร้าน (Admin Account)
- **URL เข้าสู่ระบบ:** `http://localhost:3000/admin/login`
- **Email:** `admin@supapburut.com`
- **Password:** `admin123`

### 👤 บัญชีลูกค้าตัวอย่าง (Demo Customer Account)
- **URL เข้าสู่ระบบ:** `http://localhost:3000/login`
- **Email:** `customer@example.com`
- **Password:** `customer_hashed_token` *(หรือสามารถกด "สมัครสมาชิกใหม่" ผ่านหน้า `/register` ได้ทันที)*

---

## 📜 ลิขสิทธิ์และการใช้งาน (License)

พัฒนาและปรับปรุงสำหรับ **ร้านสุภาพบุรุษ (Supapburut Card Games)**
สงวนลิขสิทธิ์ © 2026 ร้านสุภาพบุรุษ
