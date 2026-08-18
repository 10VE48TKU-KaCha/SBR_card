"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameFranchise, VariantType } from "@prisma/client";
import {
  formatCurrency,
  formatDateThai,
  getFranchiseBadgeStyle,
  getFranchiseLabel,
  getVariantTypeLabel,
} from "@/lib/utils";
import { calculateAvailableStock, calculateHierarchyStocks } from "@/lib/stock-calculator";
import { useCartStore } from "@/store/cart-store";
import {
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  ShieldCheck,
  Truck,
  Store,
  Clock,
  Check,
  Plus,
  Minus,
  ArrowRight,
  Info,
  Share2,
} from "lucide-react";

interface VariantItem {
  id: string;
  type: VariantType;
  name: string;
  sku: string;
  price: number;
  multiplier: number;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    franchise: GameFranchise;
    images: string[];
    isPreOrder: boolean;
    releaseDate: string | null;
    baseUnitName: string;
    baseStock: number;
    packsPerBox: number;
    boxesPerCarton: number;
    variants: VariantItem[];
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCartStore();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ""
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const badgeStyle = getFranchiseBadgeStyle(product.franchise);
  const franchiseLabel = getFranchiseLabel(product.franchise);

  const hierarchy = calculateHierarchyStocks({
    baseStock: product.baseStock,
    packsPerBox: product.packsPerBox,
    boxesPerCarton: product.boxesPerCarton,
  });

  // Calculate maximum purchasable for this variant
  const currentMultiplier = selectedVariant?.multiplier || 1;
  const maxPurchasableForVariant = calculateAvailableStock(
    product.baseStock,
    currentMultiplier
  );

  const isOutOfStock = maxPurchasableForVariant <= 0;

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;

    const mainImage =
      product.images && product.images.length > 0
        ? product.images[0]
        : "/logos/sp-logo.png";

    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        variantName: selectedVariant.name,
        variantType: selectedVariant.type,
        multiplier: selectedVariant.multiplier,
        unitPrice: selectedVariant.price,
        image: mainImage,
        maxPurchasable: maxPurchasableForVariant,
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeImage =
    product.images && product.images.length > 0
      ? product.images[selectedImageIndex] || product.images[0]
      : "/logos/sp-logo.png";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-gold-400">
          หน้าแรก
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gold-400">
          แคตตาล็อก
        </Link>
        <span>/</span>
        <Link
          href={`/products?franchise=${product.franchise}`}
          className="hover:text-gold-400"
        >
          {franchiseLabel}
        </Link>
        <span>/</span>
        <span className="text-slate-200 line-clamp-1">{product.name}</span>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Product Images & Watermark preview */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Showcase Image */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />

            {/* Shop Watermark Badge in Bottom-Right Corner (Exact 40% Opacity Overlay) */}
            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md rounded-2xl p-2 border border-gold-500/30 shadow-lg flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src="/logos/sp-logo.png"
                  alt="ลายน้ำร้านสุภาพบุรุษ"
                  fill
                  className="object-cover opacity-80"
                />
              </div>
              <div className="text-[10px] text-slate-300 font-mono pr-1">
                <span className="text-gold-300 font-bold block">SUPAPBURUT</span>
                <span>AUTHENTIC 100%</span>
              </div>
            </div>

            {/* Pre-order banner overlay */}
            {product.isPreOrder && (
              <div className="absolute top-4 left-4">
                <span className="px-3.5 py-1.5 rounded-full bg-rose-600/90 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 border border-rose-400/40 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>PRE-ORDER สินค้าสั่งจอง</span>
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx
                      ? "border-gold-400 shadow-gold-glow scale-105"
                      : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-[#0f1728] border border-slate-800 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-gold-400 flex-shrink-0" />
              <span>
                <strong>รับประกันของแท้ 100%:</strong> ส่งตรงจากผู้ผลิต Bushiroad / Konami โดยร้านสุภาพบุรุษ
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Store className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span>
                <strong>รับที่หน้าร้านได้ฟรี:</strong> สะดวก รวดเร็ว พร้อมบริการห่อของขวัญ
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Truck className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span>
                <strong>จัดส่งพัสดุห่อหนาแน่น:</strong> บับเบิ้ล 3 ชั้น ปกป้องมุมกล่องการ์ดสะสม
              </span>
            </div>
          </div>
        </div>

        {/* Right: Product Info, Dynamic Variant Switcher & Stock Counter */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                >
                  {franchiseLabel}
                </span>
                <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                  {product.code}
                </span>
              </div>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                title="คัดลอกลิงก์สินค้า"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? "คัดลอกแล้ว!" : "แชร์"}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              {product.name}
            </h1>

            {product.isPreOrder && product.releaseDate && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  กำหนดวางจำหน่ายอย่างเป็นทางการ: <strong>{formatDateThai(product.releaseDate)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Variant Selector (ซอง / กล่อง / ลัง) */}
          <div className="space-y-3 p-5 rounded-2xl bg-[#0f1728] border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gold-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>เลือกรูปแบบบรรจุภัณฑ์ (Variant)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                คำนวณสต็อกอัตโนมัติ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariant?.id;
                const vStock = calculateAvailableStock(product.baseStock, v.multiplier);
                const isVOutOfStock = vStock <= 0;

                return (
                  <button
                    key={v.id}
                    onClick={() => handleVariantChange(v.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-gradient-to-b from-amber-500/20 to-yellow-500/10 border-gold-400 shadow-gold-glow"
                        : "bg-[#131b2e] border-slate-800 hover:border-slate-700 opacity-90 hover:opacity-100"
                    } ${isVOutOfStock ? "opacity-50" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 line-clamp-1">
                          {v.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-gold-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1">
                        {v.multiplier > 1 ? `บรรจุ ${v.multiplier} ซอง` : "1 หน่วย"}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-gold-300">
                        {formatCurrency(v.price)}
                      </span>
                      <span
                        className={`text-[10px] font-mono ${
                          isVOutOfStock ? "text-rose-400 font-semibold" : "text-emerald-400"
                        }`}
                      >
                        {isVOutOfStock ? "หมด" : `เหลือ ${vStock}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Price & Stock Display for Selected Variant */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141e33] to-[#0c1424] border border-gold-500/30 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block">ราคาสำหรับตัวเลือกนี้:</span>
                <span className="text-3xl font-extrabold text-gold-300">
                  {formatCurrency(selectedVariant?.price || 0)}
                </span>
                {selectedVariant && selectedVariant.multiplier > 1 && (
                  <span className="text-xs text-slate-400 block mt-0.5">
                    (เฉลี่ยซองละ {formatCurrency((selectedVariant.price / selectedVariant.multiplier).toFixed(2))})
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">สถานะคงเหลือ:</span>
                <div
                  className={`text-sm font-bold flex items-center justify-end gap-1.5 ${
                    isOutOfStock ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>
                    {isOutOfStock
                      ? "สินค้าหมดชั่วคราว"
                      : `สั่งซื้อได้สูงสุด ${maxPurchasableForVariant} ชิ้น`}
                  </span>
                </div>
              </div>
            </div>

            {/* Packaging Ratio Explanation */}
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 text-gold-300 font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>อัตราส่วนการบรรจุ & สต็อกรวมของรุ่นนี้:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
                <div>
                  • 1 กล่อง = <strong>{product.packsPerBox} ซอง</strong>
                </div>
                <div>
                  • 1 ลัง = <strong>{product.boxesPerCarton} กล่อง ({product.packsPerBox * product.boxesPerCarton} ซอง)</strong>
                </div>
                <div>
                  • สต็อกรวม = <strong>{product.baseStock} {product.baseUnitName}</strong>
                </div>
              </div>
            </div>

            {/* Quantity Stepper & Actions */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-300">จำนวนที่ต้องการ:</span>
                <div className="flex items-center border border-slate-700 rounded-xl bg-[#0b0f19] overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(val, maxPurchasableForVariant)));
                    }}
                    disabled={isOutOfStock}
                    className="w-14 text-center bg-transparent font-mono font-bold text-sm text-slate-100 focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(maxPurchasableForVariant, quantity + 1))}
                    disabled={quantity >= maxPurchasableForVariant || isOutOfStock}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-xs text-slate-400">
                  รวม {formatCurrency((selectedVariant?.price || 0) * quantity)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="py-3.5 px-4 rounded-xl border border-gold-500/60 bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>เพิ่มลงตะกร้า</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-gold-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>สั่งซื้อทันที (Buy Now)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-5 rounded-2xl bg-[#0f1728] border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-slate-200">รายละเอียดสินค้า</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
