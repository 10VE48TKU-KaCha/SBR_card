"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Store,
  Truck,
  ShieldCheck,
  Package,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalItems } =
    useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-12 h-12 opacity-30" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">ไม่มีสินค้าในตะกร้าของคุณ</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            เลือกชมสินค้าการ์ดเกม การ์ดเดี่ยว บูสเตอร์บ็อกซ์ และอุปกรณ์เสริมของแท้จากร้านสุภาพบุรุษ
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-gold-glow transition-all"
        >
          <Package className="w-4 h-4" />
          <span>เลือกชมสินค้าทั้งหมด</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-gold-400" />
            <span>ตะกร้าสินค้า ({totalItems} ชิ้น)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ตรวจสอบรายการสินค้าและจำนวนก่อนดำเนินการสั่งซื้อ
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 p-2 rounded-lg hover:bg-rose-950/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>ล้างตะกร้าทั้งหมด</span>
        </button>
      </div>

      {/* Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="p-4 sm:p-5 rounded-2xl bg-[#0f1728] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Product Info & Thumbnail */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                  <Image
                    src={item.image || "/logos/sp-logo.png"}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {item.productCode}
                  </span>
                  <Link
                    href={`/products/${item.productCode}`}
                    className="text-sm sm:text-base font-bold text-slate-100 hover:text-gold-300 transition-colors line-clamp-1"
                  >
                    {item.productName}
                  </Link>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-gold-500/10 text-gold-300 text-xs font-semibold border border-gold-500/30">
                      {item.variantName}
                    </span>
                    {item.multiplier > 1 && (
                      <span className="text-xs text-slate-400">
                        (เทียบเท่า {item.multiplier} ซอง)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls & Price */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-800">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-slate-700 rounded-xl bg-[#0b0f19] overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-mono font-bold text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    disabled={item.maxPurchasable > 0 && item.quantity >= item.maxPurchasable}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[90px]">
                  <div className="text-sm sm:text-base font-bold text-gold-300">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    @{formatCurrency(item.unitPrice)}
                  </div>
                </div>

                {/* Delete Item */}
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Proceed Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#131b2e] to-[#0d1424] border border-gold-500/30 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              สรุปคำสั่งซื้อ
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>จำนวนสินค้าทั้งหมด:</span>
                <span className="font-mono font-bold text-slate-100">{totalItems} ชิ้น</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>ยอดรวมสินค้า:</span>
                <span className="font-mono font-bold text-slate-100">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800/80">
                <span>ตัวเลือกการรับสินค้า:</span>
                <span className="text-gold-300 font-medium">เลือกในขั้นตอนถัดไป</span>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">ยอดรวมเบื้องต้น</span>
                <span className="text-2xl font-extrabold text-gold-300">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            {/* Proceed to Checkout Button */}
            <Link
              href="/checkout"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold-glow transition-all"
            >
              <span>ดำเนินการชำระเงิน</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/products"
              className="block text-center text-xs text-slate-400 hover:text-gold-400 transition-colors"
            >
              ← เลือกดูสินค้าอื่นเพิ่มเติม
            </Link>
          </div>

          {/* Guarantees Box */}
          <div className="p-4 rounded-2xl bg-[#0f1728] border border-slate-800 space-y-2.5 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-gold-400" />
              <span>การรับประกันจากร้านสุภาพบุรุษ</span>
            </div>
            <p>• ระบบล็อคสต็อกอัตโนมัติ 15 นาทีหลังจากกดยืนยันคำสั่งซื้อ</p>
            <p>• รองรับการสแกน QR PromptPay ยอดเงินตรงตามเศษสตางค์</p>
          </div>
        </div>
      </div>
    </div>
  );
}
