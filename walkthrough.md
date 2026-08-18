# ผลงานการพัฒนาระบบร้านค้าออนไลน์ "ร้านสุภาพบุรุษ" (Supapburut Toys & Card Games)

ระบบ E-Commerce ระดับโปรดักชันสำหรับร้านการ์ดเกม **"ร้านสุภาพบุรุษ" (Est. 1974 - 50 ปี)** พัฒนาด้วย **Next.js 15+ (App Router, TypeScript, React Server Components, Server Actions)** เชื่อมต่อฐานข้อมูล **PostgreSQL & Prisma ORM** พร้อมระบบสต็อกเชื่อมโยงอัจฉริยะ ลายน้ำอัตโนมัติ และระบบชำระเงิน Dynamic PromptPay QR

---

## 🌟 ฟีเจอร์หลักและสถาปัตยกรรมที่พัฒนาเสร็จสมบูรณ์

### 1. 📦 ระบบสต็อกเชื่อมโยงลำดับชั้น (Hierarchical Linked Stock System)
- จัดเก็บสต็อกจริงในหน่วยย่อยที่สุด (`baseStock` ในหน่วยซอง/ชิ้น)
- กำหนดอัตราส่วนบรรจุภัณฑ์รายสินค้า:
  - $X$ (`packsPerBox`): จำนวนซองต่อ 1 กล่อง
  - $Y$ (`boxesPerCarton`): จำนวนกล่องต่อ 1 ลัง
- สูตรคำนวณจำนวนสต็อกที่สั่งซื้อได้แบบเรียลไทม์:
  $$\text{Carton Stock} = \lfloor\text{baseStock} / (X \times Y)\rfloor$$
  $$\text{Box Stock} = \lfloor\text{baseStock} / X\rfloor$$
  $$\text{Pack Stock} = \lfloor\text{baseStock} / 1\rfloor$$
- การตัดสต็อกขณะสั่งซื้อแบบ **Atomic Transaction** (`prisma.$transaction`) ป้องกัน Overselling 100%

---

### 2. 🏪 หน้าร้าน (Storefront Features)
- **หน้าแรก (Homepage):** Hero Banner ดีไซน์หรูหรา Obsidian Gold, ตราฉลอง 50 ปี (EST. 1974), ตัวกรองแฟรนไชส์เกม (Cardfight!! Vanguard, Future Card Buddyfight, Yu-Gi-Oh!, Battle Spirits, อุปกรณ์เสริม), สินค้าสั่งจองพรีออเดอร์ (Pre-Order Spotlight)
- **แคตตาล็อก & ค้นหาหลายมิติ (`/products`):** กรองตามแฟรนไชส์, สถานะพรีออเดอร์, ชนิดบรรจุภัณฑ์, และคำค้นหา รองรับ `await searchParams` ตามมาตรฐาน Next.js 15
- **หน้ารายละเอียดสินค้า (`/products/[code]`):** ตัวสลับขนาดบรรจุภัณฑ์ (Pack / Box / Carton) แบบไดนามิก แสดงราคาและสต็อกเรียลไทม์ทันทีเมื่อเปลี่ยนตัวเลือก และคำนวณจำนวนที่กดสั่งซื้อได้สูงสุดตามสต็อกที่มี
- **ตะกร้าสินค้า (Zustand Persistent Cart):** สไลด์ตะกร้าแบบ Drawer (`CartSheet`) และหน้าตะกร้าเต็ม (`/cart`) พร้อมตัวเช็คจำนวนจำกัดสต็อก
- **ระบบสั่งซื้อ & ชำระเงิน (`/checkout`):**
  - รองรับทั้งลูกค้าทั่วไป (Guest) และสมาชิก
  - ตัวเลือกการรับสินค้า: **จัดส่งพัสดุด่วน** (บวกค่าส่ง ฿50) หรือ **รับที่ร้านสุภาพบุรุษ** (ฟรี ฿0 พร้อมแสดงที่ตั้งสาขาวังบูรพา-เจริญกรุง)
- **การล็อคสต็อก 15 นาที & PromptPay QR (`/orders/[id]`):**
  - ตัวนับเวลาถอยหลัง 15 นาที (Countdown Timer) ป้องกันกั๊กสต็อก
  - ตัวสร้าง **Dynamic PromptPay QR Code** ด้วย `promptpay-qr` และ `qrcode` ยอดเงินตรงตามเศษสตางค์
  - ฟอร์มอัปโหลดสลิปธนาคาร (บันทึกภาพสะอาดแบบไม่ประทับลายน้ำ)
- **ระบบติดตามสถานะคำสั่งซื้อ (`/track`):** ค้นหาด้วยหมายเลขคำสั่งซื้อหรือเบอร์โทรศัพท์

---

### 3. 👑 ระบบจัดการหลังร้าน (Admin Dashboard: `/admin`)
- **🌐 ดูหน้าร้าน (View Store):** ปุ่มสลับไปดูหน้าร้านและปุ่มพรีวิวสินค้าแต่ละชิ้น
- **Floating Admin Bar:** แถบเครื่องมือลอยมุมจอเมื่อแอดมินเปิดดูหน้าร้าน เพื่อให้กดกลับระบบหลังร้านได้ทันที
- **จัดการสินค้า & ลายน้ำ (`/admin/products`):** เพิ่ม/แก้ไข/ลบสินค้า กำหนดค่า $X, Y$ อัตราส่วนบรรจุภัณฑ์ ราคาแต่ละตัวเลือก วันวางจำหน่ายพรีออเดอร์ และระบบอัปโหลดรูปภาพ
- **เครื่องคิดเลขรับของเข้า (`/admin/inventory`):** โมดอลคำนวณสต็อกรับของเข้าแบบ ลัง / กล่อง / ซอง แปลงสูตรเป็น `baseStock` อัตโนมัติ:
  $$(\text{Cartons} \times X \times Y) + (\text{Boxes} \times X) + \text{Packs} \to \text{Total Base Units}$$
- **ตรวจสอบสลิป & จัดส่ง (`/admin/orders`):** ตารางคำสั่งซื้อแยกแท็บสถานะ, โมดอลเปิดตรวจสลิปขยายดูยอดเงิน, ปุ่มอนุมัติการชำระเงิน, และช่องระบุหมายเลขพัสดุ (Tracking Number)
- **แดชบอร์ดสรุปยอด (`/admin/dashboard`):** สรุปยอดขายจริง, จำนวนสลิปรอตรวจ, สินค้าใกล้หมด, และคำสั่งซื้อล่าสุด

---

### 4. 🖼️ ระบบประทับลายน้ำอัตโนมัติ (Automated Sharp Watermark Pipeline)
- ฟังก์ชันเซิร์ฟเวอร์ `applyShopWatermark` ใน `src/lib/watermark.ts` ใช้ `sharp` ทำการซ้อนภาพโลโก้ร้าน (`/public/logos/watermark.png`) ที่มุมขวาล่างด้วยความโปร่งใส **40% Opacity** ก่อนบันทึก
- **ไม่ประทับลายน้ำ** บนสลิปการโอนเงินที่ลูกค้าอัปโหลด

---

### 5. ⏱️ ระบบคืนสต็อกอัตโนมัติ (Auto Stock Recovery Cron)
- API Route `/api/cron/cleanup-orders`: ค้นหาคำสั่งซื้อที่อยู่ในสถานะ `PENDING_PAYMENT` และหมดเวลา 15 นาที (`expiresAt <= now()`) ทำการคืนจำนวน `deductedBaseUnits` กลับเข้า `product.baseStock` และเปลี่ยนสถานะคำสั่งซื้อเป็น `CANCELLED`
- มีปุ่ม **"คืนสต็อกออเดอร์หมดเวลา (Run Cleanup)"** ในหน้าจัดการคำสั่งซื้อหลังร้านสำหรับแอดมินกดรันเองได้ทันที

---

## 🧪 ผลการทดสอบระบบ (Verification Results)

```
=========================================
🧪 RUNNING FULL SYSTEM VERIFICATION TEST
=========================================

1️⃣ Testing Hierarchical Linked Stock Formula:
- Base stock: 512 packs
- Calculated Carton stock (512 / 256): 2 cartons (Expected: 2)
- Calculated Box stock (512 / 16): 32 boxes (Expected: 32)
- Calculated Pack stock (512 / 1): 512 packs (Expected: 512)
✅ Hierarchical stock formula verified!

2️⃣ Testing Stock Intake Calculator (2 Cartons + 3 Boxes + 5 Packs):
- Converted Total Base Units: 565 (Expected: 565)
✅ Stock intake conversion verified!

3️⃣ Testing Dynamic PromptPay QR Generator:
- Amount: 1450.75
- Recipient: 081-999-8888
- EMVCo Payload: 00020101021229370016A000000677010111011300668199988885802TH530376454071450.75630493D7
✅ Dynamic PromptPay QR verified!

4️⃣ Testing Sharp Automated Watermark Pipeline:
- Original buffer size: 4019 bytes
- Watermarked buffer size: 11396 bytes
- Watermarked image format: jpeg, 800x800
✅ Automated Sharp watermark pipeline verified!

5️⃣ Testing Auto Stock Recovery on Database:
- Product: Cardfight!! Vanguard DZ-BT02: Illusions of the Crescent Moon
- Initial Base Stock: 512 packs
- Stock after order placement: 510 packs (-2)
- Stock after auto recovery: 512 packs (Restored!)
✅ Auto Stock Recovery & Order cleanup verified successfully!

=========================================
🎉 ALL VERIFICATION TESTS PASSED (100%)
=========================================
```

### Next.js Production Build:
```
Route (app)                                 Size  First Load JS
┌ ○ /                                      176 B         111 kB
├ ƒ /admin/dashboard                       162 B         106 kB
├ ƒ /admin/inventory                     5.33 kB         116 kB
├ ƒ /admin/orders                        7.08 kB         135 kB
├ ƒ /admin/products                      7.58 kB         135 kB
├ ƒ /api/cron/cleanup-orders               127 B         103 kB
├ ƒ /api/upload                            127 B         103 kB
├ ○ /cart                                4.79 kB         134 kB
├ ○ /checkout                            8.47 kB         131 kB
├ ƒ /orders/[id]                         12.2 kB         140 kB
├ ƒ /products                              176 B         111 kB
├ ƒ /products/[code]                     7.04 kB         137 kB
└ ○ /track                               2.31 kB         105 kB
```
