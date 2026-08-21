import React from "react";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { GameFranchise } from "@prisma/client";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
  Award,
  Package,
  Layers,
  ChevronRight,
  Clock,
  Swords,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch featured products safely with fallback
  let preOrderProducts: any[] = [];
  let latestProducts: any[] = [];
  let vanguardProducts: any[] = [];
  let yugiohProducts: any[] = [];
  let totalActiveProducts = 0;

  try {
    const res = await Promise.all([
      prisma.product.findMany({
        where: { isPreOrder: true, isActive: true },
        include: { variants: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { variants: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { franchise: GameFranchise.VANGUARD, isActive: true },
        include: { variants: true },
        take: 4,
      }),
      prisma.product.findMany({
        where: { franchise: GameFranchise.YUGIOH, isActive: true },
        include: { variants: true },
        take: 4,
      }),
      prisma.product.count({
        where: { isActive: true },
      }),
    ]);
    preOrderProducts = res[0];
    latestProducts = res[1];
    vanguardProducts = res[2];
    yugiohProducts = res[3];
    totalActiveProducts = res[4];
  } catch (error) {
    console.error("HomePage data fetch error:", error);
  }

  const remainingProductsCount = Math.max(0, totalActiveProducts - latestProducts.length);

  const franchiseCategories = [
    {
      name: "Cardfight!! Vanguard",
      franchise: "VANGUARD",
      icon: Swords,
      desc: "การ์ดแวนการ์ดภาษาญี่ปุ่น & แปลไทย บูสเตอร์ บ็อกซ์ ลังเด็ค",
      color: "from-blue-600/30 to-indigo-900/40 border-blue-500/40",
      accent: "text-blue-400",
    },
    {
      name: "Future Card Buddyfight",
      franchise: "BUDDYFIGHT",
      icon: Zap,
      desc: "การ์ดบัดดี้ไฟท์สุดมันส์ ชุดพิเศษ การ์ดไม้ตาย ฟอยล์การันตี",
      color: "from-amber-600/30 to-orange-900/40 border-amber-500/40",
      accent: "text-amber-400",
    },
    {
      name: "Yu-Gi-Oh! OCG / TCG",
      franchise: "YUGIOH",
      icon: Sparkles,
      desc: "ยูกิโอการ์ดแท้ Rarity Collection, Structure Deck, กล่องสะสม",
      color: "from-purple-600/30 to-fuchsia-900/40 border-purple-500/40",
      accent: "text-purple-400",
    },
    {
      name: "Battle Spirits",
      franchise: "BATTLE_SPIRITS",
      icon: Flame,
      desc: "แบทเทิลสปิริตส์ โคลาโบกันดั้ม เมก้าเด็ค พร้อมลุย",
      color: "from-emerald-600/30 to-teal-900/40 border-emerald-500/40",
      accent: "text-emerald-400",
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-gold-500/20 bg-radial-gradient">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-gold-500/40 text-gold-300 text-xs font-semibold shadow-gold-glow">
                <Award className="w-4 h-4 text-gold-400" />
                <span>ศูนย์รวมการ์ดเกมแท้ 100% จากผู้ผลิตชั้นนำ</span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                ศูนย์รวมการ์ดเกมระดับพรีเมียม <br className="hidden sm:inline" />
                <span className="gold-gradient-text">
                  "ร้านสุภาพบุรุษ"
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                การ์ดเกมแท้ 100% จากผู้ผลิต Bushiroad, Konami และ Bandai ครบทุกประเภท
                เลือกซื้อได้ทั้งแบบ <strong className="text-gold-300">ซองเดี่ยว</strong>,{" "}
                <strong className="text-gold-300">กล่อง Booster Box</strong> และ{" "}
                <strong className="text-gold-300">ลัง Carton Case</strong> พร้อมระบบคำนวณสต็อกเรียลไทม์
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/products"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-gold-glow transition-all hover:scale-105"
                >
                  <Package className="w-4 h-4" />
                  <span>เลือกชมสินค้าทั้งหมด</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/products?preOrder=true"
                  className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-rose-300 hover:text-rose-200 font-semibold text-sm border border-rose-500/40 flex items-center gap-2 transition-all"
                >
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>สินค้าพรีออเดอร์ (Pre-Order)</span>
                </Link>

                <Link
                  href="/track"
                  className="px-5 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 text-sm border border-slate-700/80 flex items-center gap-2 transition-colors"
                >
                  <span>🔍 เช็คคำสั่งซื้อ</span>
                </Link>
              </div>

              {/* Feature Points */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 text-center lg:text-left">
                <div>
                  <div className="text-xl font-bold text-gold-400">100% แท้</div>
                  <div className="text-[11px] text-slate-400">ลิขสิทธิ์ตรงจากญี่ปุ่น</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-100">15 นาที</div>
                  <div className="text-[11px] text-slate-400">ระบบล็อคสต็อกอัตโนมัติ</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-100">ส่งไว / รับร้าน</div>
                  <div className="text-[11px] text-slate-400">หน้าร้านใจกลางพระนคร</div>
                </div>
              </div>
            </div>

            {/* Right Emblem & Featured Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
                {/* Outer Golden Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gold-600/30 via-yellow-500/20 to-amber-600/40 blur-2xl animate-pulse" />
                
                {/* Emblem Box */}
                <div className="relative w-full h-full rounded-full p-4 border-2 border-gold-400/60 bg-[#0d1424] shadow-2xl flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logos/sp-logo.png"
                    alt="ร้านสุภาพบุรุษ ตราฉลอง 50 ปี"
                    fill
                    className="object-contain p-4 hover:scale-105 transition-transform duration-700"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Franchise Quick Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold-400" />
              <span>เลือกดูตามการ์ดเกมที่คุณเล่น</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              เข้าถึงบูสเตอร์บ็อกซ์ กล่องเด็ค และอุปกรณ์เสริมของแต่ละแฟรนไชส์ได้ทันที
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {franchiseCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.franchise}
                href={`/products?franchise=${cat.franchise}`}
                className={`p-5 rounded-2xl bg-gradient-to-br ${cat.color} border hover:scale-[1.02] transition-all duration-300 group shadow-lg flex flex-col justify-between`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform">
                    <Icon className={`w-5 h-5 ${cat.accent}`} />
                  </div>
                  <h3 className="font-bold text-base text-white group-hover:text-gold-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-300/80 mt-1.5 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-medium text-slate-300 group-hover:text-gold-300">
                  <span>เลือกดูสินค้า</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Pre-Order Highlights */}
      {preOrderProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/40 via-amber-950/20 to-slate-900 border border-rose-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40 mb-2">
                  <Flame className="w-3.5 h-3.5 animate-bounce text-rose-400" />
                  <span>PRE-ORDER SPOTLIGHT</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  สั่งจองล่วงหน้า การันตีได้รับของวันแรก
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  สั่งจองราคาพิเศษ พร้อมรับโปรโมชั่นและของแถมสุดเอ็กซ์คลูซีฟเฉพาะร้านสุภาพบุรุษ
                </p>
              </div>

              <Link
                href="/products?preOrder=true"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-center"
              >
                <span>ดูพรีออเดอร์ทั้งหมด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {preOrderProducts.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products & Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <span>สินค้ามาใหม่ & พร้อมจัดส่งทันที</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              คำนวณสต็อกเรียลไทม์ ซื้อได้ทั้ง ซอง / กล่อง / ลัง
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
          >
            <span>
              ดูสินค้าทั้งหมด{remainingProductsCount > 0 ? ` (+${remainingProductsCount})` : ""}
            </span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {latestProducts.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      </section>
    </div>
  );
}
