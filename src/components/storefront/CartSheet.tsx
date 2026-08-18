"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Store, Truck } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency, getVariantTypeLabel } from "@/lib/utils";

export function CartSheet() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, getTotalPrice, getTotalItems } =
    useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0e1524] border-l border-gold-500/20 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#131d31]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-100">
                ตะกร้าสินค้า ({totalItems} รายการ)
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-slate-300 font-medium">ยังไม่มีสินค้าในตะกร้า</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  เลือกชมสินค้าการ์ดเกมและอุปกรณ์เสริมแท้ลิขสิทธิ์จากร้านสุภาพบุรุษ
                </p>
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="inline-block mt-2 px-5 py-2 rounded-lg bg-gold-500 text-slate-950 text-xs font-bold hover:bg-gold-400 transition-colors"
                >
                  เลือกดูสินค้าทั้งหมด
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.variantId}
                  className="p-3 rounded-xl bg-[#141e33] border border-slate-800 hover:border-slate-700 flex gap-3.5 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                    <Image
                      src={item.image || "/logos/sp-logo.png"}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/products/${item.productCode}`}
                          onClick={() => setIsOpen(false)}
                          className="text-xs font-semibold text-slate-200 hover:text-gold-300 transition-colors line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gold-500/10 text-gold-300 border border-gold-500/30 font-medium">
                          {item.variantName}
                        </span>
                        {item.multiplier > 1 && (
                          <span className="text-[10px] text-slate-400">
                            (เทียบเท่า {item.multiplier} ซอง)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                      <div className="flex items-center border border-slate-700 rounded-md bg-[#0c1220] overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-semibold text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.maxPurchasable > 0 && item.quantity >= item.maxPurchasable}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-gold-300">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @{formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-[#121b2d] space-y-4">
              {/* Delivery hints */}
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-purple-400" /> รับที่ร้านสุภาพบุรุษ (ฟรี)
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-400" /> จัดส่งพัสดุ (฿50)
                </span>
              </div>

              {/* Subtotal */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">ยอดรวมสินค้า:</span>
                  <span className="text-base font-bold text-gold-300">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 text-right">
                  *ยังไม่รวมค่าจัดส่ง (สามารถเลือกรับที่หน้าร้านได้ฟรีในหน้าชำระเงิน)
                </p>
              </div>

              {/* Checkout Button */}
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition-colors"
                >
                  ดูตะกร้าทั้งหมด
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-gold-glow transition-all"
                >
                  <span>สั่งซื้อสินค้า</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
