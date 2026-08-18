# Implementation Plan: ร้านสุภาพบุรุษ (Supapburut) TCG E-Commerce Platform

Building a production-ready, full-stack Trading Card Game (TCG) E-Commerce web application for **"ร้านสุภาพบุรุษ" (Supapburut Toys & Card Games - Est. 1974)**.

The system features a **Hierarchical Linked Stock System** (packs/boxes/cartons), **Dynamic PromptPay QR Code Generation**, **Automated Watermarking Pipeline** using Sharp, **15-Minute Payment Hold with Auto-Recovery Cron**, and a **Modern Next.js 15+ App Router Storefront & Admin Portal**.

---

## 🏗️ Architecture & Technical Design

```
+-----------------------------------------------------------------------------------+
|                                 Next.js App Router                                |
|                                                                                   |
|  +-------------------------------------+   +------------------------------------+ |
|  |           Storefront                |   |          Admin Dashboard           | |
|  | - Hero, Franchise & Pre-order Filter|   | - Product CRUD & Ratio Config      | |
|  | - Dynamic Pack/Box/Carton Switcher  |   | - Stock Intake Calculator (X/Y)    | |
|  | - Zustand Shopping Cart             |   | - Payment Slip Verification Modal  | |
|  | - PromptPay QR & Slip Uploader      |   | - Floating Admin Bar & Switcher    | |
|  | - 15-min Hold & Order Tracking      |   | - Dashboard Metrics & Revenue      | |
|  +-------------------------------------+   +------------------------------------+ |
|                                                                                   |
|  +------------------------------------------------------------------------------+ |
|  |                            Server Layer / APIs                               | |
|  | - Server Actions: Orders, Checkout, Stock Intake, Verification               | |
|  | - /api/upload: Sharp image pipeline with watermark composition               | |
|  | - /api/cron/cleanup-orders: Auto-cancellation & baseStock recovery            | |
|  | - lib/promptpay.ts: Dynamic PromptPay payload + QR generator                 | |
|  | - lib/stock-calculator.ts: Atomic pack/box/carton baseStock formulas         | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
                                          |
                                    Prisma ORM
                                          |
                         PostgreSQL Database (or SQLite Fallback)
```

---

## 📦 Core Business Logic & Algorithms

### 1. Hierarchical Linked Stock Formula
- Lowest atomic unit: `baseStock` (ซอง / packs)
- Packaging ratios configured per product:
  - $X$ = `packsPerBox` (e.g. 16 packs/box)
  - $Y$ = `boxesPerCarton` (e.g. 16 boxes/carton $\to$ 256 packs/carton)
- Real-time stock calculation:
  $$\text{Carton Stock} = \lfloor\text{baseStock} / (X \times Y)\rfloor$$
  $$\text{Box Stock} = \lfloor\text{baseStock} / X\rfloor$$
  $$\text{Pack Stock} = \lfloor\text{baseStock} / 1\rfloor$$
- Checkout stock reduction:
  $$\text{Total Deducted Base Units} = \sum (\text{item.quantity} \times \text{variant.multiplier})$$
  Executed inside a single atomic `prisma.$transaction` with row-level safety to prevent overselling.

### 2. Payment & 15-Minute Expiration Hold
- When an order is created, status is `PENDING_PAYMENT` with `expiresAt = now() + 15 minutes`.
- Stock is held immediately by deducting `baseStock`.
- A dynamic PromptPay QR code is generated with the exact amount (e.g. 1,290.00 THB) using `promptpay-qr` and `qrcode`.
- Customer uploads a bank payment slip, transitioning the status to `PENDING_VERIFICATION`.
- Unpaid orders past 15 minutes are cancelled by the cron job `/api/cron/cleanup-orders` and the exact `deductedBaseUnits` are refunded back to `baseStock`.

### 3. Automated Watermark Pipeline
- Uploaded product images are composited with the shop logo (`/public/logos/watermark.png`) at the bottom-right corner with 40% opacity using `sharp`.
- Uploaded payment slips are strictly isolated and saved cleanly **without** watermarks.

---

## 🗂️ Proposed File Structure & Changes

### 1. Project Initialization & Dependencies
- Next.js 15+ (App Router, TypeScript, Tailwind CSS, PostCSS)
- Prisma ORM (`@prisma/client`, `prisma`)
- Utilities: `sharp`, `promptpay-qr`, `qrcode`, `@types/qrcode`, `zustand`, `zod`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `clsx`, `tailwind-merge`, `canvas-confetti`

### 2. Database Layer
#### [NEW] [schema.prisma](file:///c:/ProgramDEV/สุภาพบุรุษ/prisma/schema.prisma)
- Exact database schema as specified in the prompt: `User`, `Product`, `ProductVariant`, `Order`, `OrderItem`, Enums (`Role`, `GameFranchise`, `VariantType`, `OrderStatus`, `FulfillmentType`).
#### [NEW] [seed.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/prisma/seed.ts)
- Comprehensive seed data with rich TCG products:
  - **Cardfight!! Vanguard**: Booster Sets (V-BT01, D-BT12), Starter Decks, Pre-orders.
  - **Future Card Buddyfight**: Climax Boosters, Special Series.
  - **Yu-Gi-Oh!**: Rarity Collection, 25th Anniversary Boxes, Structure Decks.
  - **Battle Spirits**: Collaboration Boosters, Contract Decks.
  - **Accessories & Sleeves**: Official Gentleman sleeves, Deck boxes, Playmats.
  - Pre-configured variants (Single Pack, Booster Box, Carton Case) with proper $X, Y$ ratios and base stocks.

### 3. Core Libraries & Utilities
#### [NEW] [prisma.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/src/lib/prisma.ts)
- Global Prisma client singleton.
#### [NEW] [stock-calculator.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/src/lib/stock-calculator.ts)
- Functions: `calculateVariantStocks`, `calculateDeductedUnits`, `calculateStockIntakeTotal`, `formatStockDisplay`.
#### [NEW] [promptpay.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/src/lib/promptpay.ts)
- Dynamic PromptPay QR payload generator and base64 image renderer.
#### [NEW] [watermark.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/src/lib/watermark.ts)
- Sharp watermarking service for product images (resizing, logo overlay at bottom-right, 40% alpha).
#### [NEW] [cart-store.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/src/store/cart-store.ts)
- Zustand persistent cart store with stock checks, variant switching, quantity limits, and total calculations.

### 4. API Endpoints
#### [NEW] [route.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/api/upload/route.ts)
- Multipart image uploader supporting product images (with watermarking) and payment slips (clean).
#### [NEW] [route.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/api/cron/cleanup-orders/route.ts)
- Auto stock recovery for expired `PENDING_PAYMENT` orders.
#### [NEW] [route.ts](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/api/orders/route.ts)
- Order creation Server Action / API with atomic stock deduction and PromptPay payload generation.

### 5. UI Components & Design System
- Gentleman Shop Theme: Rich Obsidian/Navy Dark Gold Luxury Aesthetics (`#0d1117`, `#161b22`, `#d4af37`, `#f3ba2f`, crimson accents) matching the 50-year heritage badge logo.
#### [NEW] [Navbar.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/components/storefront/Navbar.tsx)
- Brand logo, Franchise navigation, Search bar, Cart drawer toggle with live badge count, Order lookup shortcut.
#### [NEW] [Footer.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/components/storefront/Footer.tsx)
- Store location ("ร้านสุภาพบุรุษ"), Contact, Open hours, Payment methods, 50th Anniversary badge.
#### [NEW] [ProductCard.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/components/storefront/ProductCard.tsx)
- Pre-order badge, Franchise tag, price range or lowest pack price, quick add to cart, available variants summary.
#### [NEW] [CartSheet.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/components/storefront/CartSheet.tsx)
- Slide-over cart drawer, items list, variant indicator, quantity stepper with stock constraints, checkout button.
#### [NEW] [FloatingAdminBar.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/components/storefront/FloatingAdminBar.tsx)
- Floating button when navigating storefront to return to `/admin` or jump into product edit mode.
#### [NEW] [AdminSidebar.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/components/admin/AdminSidebar.tsx)
- Admin navigation, "🌐 ดูหน้าร้าน (View Store)" button, quick stats badge.
#### [NEW] [StockIntakeModal.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/components/admin/StockIntakeModal.tsx)
- Dynamic Carton/Box/Pack stock intake calculator with instant formula preview.
#### [NEW] [SlipViewerModal.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/components/admin/SlipViewerModal.tsx)
- Payment slip zoom viewer, amount comparison, approve / reject actions.

### 6. Storefront Pages
#### [NEW] [(storefront)/layout.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/(storefront)/layout.tsx)
- Storefront header, floating admin badge, footer, toast provider, cart sheet.
#### [NEW] [(storefront)/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/(storefront)/page.tsx)
- Hero banner with TCG highlights, Pre-order spotlight, Game franchise quick filter tabs, Best sellers, New arrivals, 50-year heritage badge.
#### [NEW] [(storefront)/products/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/(storefront)/products/page.tsx)
- Full catalog with sidebar filters (Franchise, Product Type, Stock Status, Price Range, Search query).
#### [NEW] [(storefront)/products/[code]/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/(storefront)/products/[code]/page.tsx)
- Product detail page with Pack / Box / Carton interactive selector, dynamic price and stock counter, multiplier ratio explanation, pre-order release countdown, add-to-cart button.
#### [NEW] [(storefront)/cart/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/(storefront)/cart/page.tsx)
- Full cart review page with item quantity adjustments and order summary.
#### [NEW] [(storefront)/checkout/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/(storefront)/checkout/page.tsx)
- Checkout form with guest/member support, Fulfillment switch (Delivery with address vs Store Pickup "รับที่ร้านสุภาพบุรุษ"), Order placement action.
#### [NEW] [(storefront)/orders/[id]/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/(storefront)/orders/[id]/page.tsx)
- Order status page with 15-minute countdown timer, dynamic PromptPay QR code, payment slip uploader, order timeline, tracking number link.
#### [NEW] [(storefront)/track/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/(storefront)/track/page.tsx)
- Quick order lookup by Order ID or Phone Number.

### 7. Admin Dashboard Pages
#### [NEW] [admin/layout.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/admin/layout.tsx)
- Admin layout with Sidebar, Top navbar, "🌐 ดูหน้าร้าน (View Store)" action, Quick stats.
#### [NEW] [admin/dashboard/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/admin/dashboard/page.tsx)
- Sales overview, pending verifications, low stock warnings, recent orders table, franchise distribution charts.
#### [NEW] [admin/products/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/admin/products/page.tsx)
- Product CRUD table, quick view link to storefront page, create product modal with $X, Y$ packaging ratios, variant price configurations, image uploader with watermark.
#### [NEW] [admin/inventory/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/admin/inventory/page.tsx)
- Stock management table displaying `baseStock`, Carton stock, Box stock, Pack stock, and "รับของเข้า (Stock Intake)" calculator modal.
#### [NEW] [admin/orders/page.tsx](file:///c:/ProgramDEV/สุภาพบุรุษ/src/app/admin/orders/page.tsx)
- Order management table, status tabs (`PENDING_PAYMENT`, `PENDING_VERIFICATION`, `PAID`, `READY_FOR_PICKUP`, `SHIPPED`), slip verification modal, tracking number assignment, manual cleanup trigger.

---

## 🧪 Verification Plan

### Automated Tests & Checks
1. **Next.js Build & Linting:**
   - Execute `npm run build` to verify all TypeScript types, RSC, Server Actions, and dynamic routes compile cleanly.
2. **Database & Schema Validation:**
   - Run `npx prisma generate` and `npx prisma db push` (or migrate) and run `npx prisma db seed`.
3. **Stock Unit Math & Concurrency Verification:**
   - Run unit test / script verifying Carton/Box/Pack calculation formula and atomic deduction logic.
4. **PromptPay & Watermark Verification:**
   - Test `sharp` watermark composite on sample images and verify watermark output.
   - Test dynamic PromptPay QR string generation for sample amount.
5. **Auto-Cleanup Cron Test:**
   - Call `/api/cron/cleanup-orders` and verify expired orders are marked `CANCELLED` and base units restored.

### Manual End-to-End Verification
- **Customer Flow:** Browse homepage $\to$ filter Vanguard products $\to$ select Booster Box variant $\to$ add to cart $\to$ checkout with PromptPay QR $\to$ verify 15-minute countdown $\to$ upload slip $\to$ track order.
- **Admin Flow:** Access `/admin` $\to$ view pending slip in slip modal $\to$ approve order $\to$ add tracking number $\to$ use Stock Intake Calculator to add 2 Cartons + 3 Boxes + 5 Packs and verify calculated `baseStock` updates immediately $\to$ switch back to storefront via "🌐 ดูหน้าร้าน".
