import React from "react";
import Image from "next/image";
import Link from "next/link";
import { GameFranchise, VariantType } from "@prisma/client";
import {
  formatCurrency,
  formatDateShort,
  getFranchiseBadgeStyle,
  getFranchiseLabel,
  getRarityBadgeStyle,
  getLanguageLabel,
} from "@/lib/utils";
import { calculateHierarchyStocks } from "@/lib/stock-calculator";
import { Package, Layers, Sparkles, Clock, CheckCircle2, ShieldCheck } from "lucide-react";

export interface ProductCardProps {
  product: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    franchise: GameFranchise;
    images: string[];
    isPreOrder: boolean;
    releaseDate: Date | string | null;
    baseUnitName: string;
    baseStock: number;
    packsPerBox: number;
    boxesPerCarton: number;
    isSingleCard?: boolean;
    cardNumber?: string | null;
    rarity?: string | null;
    cardLanguage?: string | null;
    clanNation?: string | null;
    cardType?: string | null;
    foilType?: string | null;
    variants: {
      id: string;
      type: VariantType;
      name: string;
      price: any;
      multiplier: number;
    }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const badgeStyle = getFranchiseBadgeStyle(product.franchise);
  const franchiseLabel = getFranchiseLabel(product.franchise);

  const prices = product.variants.map((v) => Number(v.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const isSingle = Boolean(product.isSingleCard);
  const rarityStyle = isSingle && product.rarity ? getRarityBadgeStyle(product.rarity) : null;

  const { cartonStock, boxStock, packStock } = calculateHierarchyStocks({
    baseStock: product.baseStock,
    packsPerBox: product.packsPerBox,
    boxesPerCarton: product.boxesPerCarton,
  });

  const mainImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : "/logos/sp-logo.png";

  const isOutOfStock = product.baseStock <= 0;

  return (
    <div className="group relative rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border border-slate-800 hover:border-gold-500/50 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-gold-glow">
      {/* Top Image Container */}
      <Link
        href={`/products/${product.code}`}
        className="relative w-full aspect-[4/3] overflow-hidden bg-slate-950 block"
      >
        <Image
          src={mainImage}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-transparent to-transparent opacity-80" />

        {/* Shop Logo Watermark Badge */}
        <div className="absolute bottom-2.5 right-2.5 opacity-60 group-hover:opacity-90 transition-opacity bg-black/40 backdrop-blur-sm rounded-full p-1 border border-gold-500/30">
          <div className="relative w-7 h-7 rounded-full overflow-hidden">
            <Image
              src="/logos/sp-logo.png"
              alt="สุภาพบุรุษ ลายน้ำแท้"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Pre-Order or In-Stock Status Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.isPreOrder ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[11px] font-bold shadow-md flex items-center gap-1 border border-rose-400/40 animate-pulse">
              <Clock className="w-3 h-3" />
              <span>PRE-ORDER</span>
            </span>
          ) : isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-400 text-[11px] font-semibold border border-slate-700">
              สินค้าหมด
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-[11px] font-semibold border border-emerald-700/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>พร้อมส่ง</span>
            </span>
          )}

          {/* Franchise Tag */}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
          >
            {franchiseLabel}
          </span>
        </div>

        {/* Product Code / Card Number Badge */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
          {isSingle && product.rarity && rarityStyle && (
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase border ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border} ${rarityStyle.glow || ""}`}
            >
              {product.rarity}
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-black/75 text-slate-300 text-[10px] font-mono border border-slate-700">
            {product.cardNumber || product.code}
          </span>
        </div>
      </Link>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Single Card Mint Guarantee & Attributes */}
          {isSingle ? (
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-gold-400" />
                <span>ของแท้ สภาพใหม่ 100%</span>
              </span>
              {product.clanNation && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                  {product.clanNation}
                </span>
              )}
            </div>
          ) : product.isPreOrder && product.releaseDate ? (
            <div className="text-[11px] text-amber-400/90 font-medium mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>กำหนดวางจำหน่าย: {formatDateShort(product.releaseDate)}</span>
            </div>
          ) : null}

          {/* Product Title */}
          <Link
            href={`/products/${product.code}`}
            className="text-sm font-semibold text-slate-100 group-hover:text-gold-300 transition-colors line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>
        </div>

        {/* Stock Breakdown */}
        <div className="bg-[#090d16]/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Package className="w-3 h-3 text-gold-400" /> สต็อกคงเหลือ:
            </span>
            <span className="font-mono font-medium text-slate-200">
              {product.baseStock} {isSingle ? "ใบ" : product.baseUnitName}
            </span>
          </div>

          {!isSingle ? (
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
              <span>ลัง: <strong className="text-slate-300">{cartonStock}</strong></span>
              <span>กล่อง: <strong className="text-slate-300">{boxStock}</strong></span>
              <span>{product.baseUnitName}: <strong className="text-slate-300">{packStock}</strong></span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
              <span>ภาษา: <strong className="text-slate-300">{getLanguageLabel(product.cardLanguage)}</strong></span>
              <span>สถานะ: <strong className="text-emerald-400">พร้อมส่งทันที</strong></span>
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block">ราคา</span>
            <div className="text-base font-bold text-gold-300">
              {minPrice === maxPrice
                ? formatCurrency(minPrice)
                : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
            </div>
          </div>

          <Link
            href={`/products/${product.code}`}
            className="px-3 py-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500 text-gold-300 hover:text-slate-950 border border-gold-500/40 text-xs font-semibold transition-all flex items-center gap-1"
          >
            <span>{isSingle ? "ดูรายละเอียด" : "เลือกขนาด"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
