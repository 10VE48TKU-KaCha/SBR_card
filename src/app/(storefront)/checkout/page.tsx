"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { FulfillmentType } from "@prisma/client";
import { createOrderAction } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";
import {
  Truck,
  Store,
  ShieldCheck,
  QrCode,
  ArrowRight,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  User,
  Mail,
  Lock,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(
    FulfillmentType.DELIVERY
  );
  const [shippingAddress, setShippingAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Store className="w-10 h-10 opacity-30" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">ไม่มีสินค้าในตะกร้า</h1>
        <p className="text-sm text-slate-400">
          กรุณาเลือกสินค้าจากแคตตาล็อกก่อนดำเนินการสั่งซื้อ
        </p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-xl bg-gold-500 text-slate-950 font-bold text-sm"
        >
          กลับไปเลือกสินค้า
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shippingFee = fulfillmentType === FulfillmentType.DELIVERY ? 50 : 0;
  const grandTotal = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("กรุณาระบุชื่อ-นามสกุลของผู้รับ");
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      setErrorMessage("กรุณาระบุหมายเลขโทรศัพท์ที่ถูกต้อง (อย่างน้อย 9-10 หลัก)");
      return;
    }

    if (fulfillmentType === FulfillmentType.DELIVERY && !shippingAddress.trim()) {
      setErrorMessage("กรุณาระบุที่อยู่สำหรับจัดส่งพัสดุอย่างละเอียด");
      return;
    }

    setLoading(true);

    try {
      const result = await createOrderAction({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        fulfillmentType,
        shippingAddress:
          fulfillmentType === FulfillmentType.DELIVERY ? shippingAddress.trim() : undefined,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });

      if (!result.success || !result.order) {
        setErrorMessage(result.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
        setLoading(false);
        return;
      }

      // Clear shopping cart upon successful creation
      clearCart();

      // Navigate to order status & PromptPay QR page
      router.push(`/orders/${result.order.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Checkout Title */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <Lock className="w-7 h-7 text-gold-400" />
          <span>ชำระเงินและยืนยันคำสั่งซื้อ</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          ระบบจะทำการล็อคสต็อกสินค้าให้ท่านทันทีเป็นเวลา 15 นาทีหลังจากกดยืนยันคำสั่งซื้อ
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Customer & Delivery Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Fulfillment Switcher */}
          <div className="p-6 rounded-3xl bg-[#0f1728] border border-slate-800 space-y-4">
            <label className="text-sm font-bold text-gold-300 uppercase tracking-wider block">
              1. เลือกช่องทางการรับสินค้า
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Delivery Option */}
              <button
                type="button"
                onClick={() => setFulfillmentType(FulfillmentType.DELIVERY)}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  fulfillmentType === FulfillmentType.DELIVERY
                    ? "bg-gradient-to-br from-blue-950/50 to-indigo-950/40 border-blue-400 shadow-lg"
                    : "bg-[#131b2e] border-slate-800 opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                      จัดส่งพัสดุด่วนถึงบ้าน
                    </h3>
                    <p className="text-[11px] text-slate-400">ค่าจัดส่ง ฿50 (ห่อบับเบิ้ลหนาแน่น)</p>
                  </div>
                </div>
              </button>

              {/* Store Pickup Option */}
              <button
                type="button"
                onClick={() => setFulfillmentType(FulfillmentType.STORE_PICKUP)}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  fulfillmentType === FulfillmentType.STORE_PICKUP
                    ? "bg-gradient-to-br from-purple-950/50 to-amber-950/40 border-purple-400 shadow-lg"
                    : "bg-[#131b2e] border-slate-800 opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                      รับที่ร้านสุภาพบุรุษ
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-semibold">ไม่มีค่าจัดส่ง (ฟรี)</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Store Pickup Notice */}
            {fulfillmentType === FulfillmentType.STORE_PICKUP && (
              <div className="p-4 rounded-2xl bg-[#141b2c] border border-purple-500/30 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>ที่ตั้งสาขาสำหรับเข้ารับสินค้า:</span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-6">
                  ร้านสุภาพบุรุษ (วังบูรพา-เจริญกรุง) เลขที่ 123/45 ถนนเจริญกรุง แขวงวังบูรพาภิรมย์ เขตพระนคร กรุงเทพฯ 10200
                  <br />
                  <span className="text-slate-400 text-[11px]">
                    (เปิดบริการทุกวัน 10:00 - 20:00 น. นำรหัสคำสั่งซื้อมาแสดงต่อพนักงานหน้าร้าน)
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Customer Information Form */}
          <div className="p-6 rounded-3xl bg-[#0f1728] border border-slate-800 space-y-4">
            <label className="text-sm font-bold text-gold-300 uppercase tracking-wider block">
              2. ข้อมูลผู้สั่งซื้อ & การติดต่อ
            </label>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-gold-400" />
                  <span>ชื่อ-นามสกุล ผู้รับสินค้า *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-gold-400" />
                    <span>เบอร์โทรศัพท์ (สำหรับยืนยัน/รับของ) *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 081-234-5678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-gold-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-gold-400" />
                    <span>อีเมล (รับหลักฐานและใบเสร็จ)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="somchai@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Delivery Address (only if Delivery selected) */}
              {fulfillmentType === FulfillmentType.DELIVERY && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold-400" />
                    <span>ที่อยู่สำหรับจัดส่งพัสดุอย่างละเอียด *</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="บ้านเลขที่, หมู่บ้าน/อาคาร, ซอย, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-gold-400"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Summary & Payment Instructions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border border-gold-500/30 space-y-5 shadow-2xl">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>รายการสินค้า ({items.length})</span>
              <span className="text-xs font-normal text-gold-400">
                {fulfillmentType === FulfillmentType.DELIVERY ? "จัดส่งพัสดุ" : "รับที่หน้าร้าน"}
              </span>
            </h2>

            {/* Item list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-800/60 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-200 line-clamp-1">{item.productName}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.variantName} x {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-gold-300 flex-shrink-0">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 pt-2 text-xs sm:text-sm border-t border-slate-800">
              <div className="flex items-center justify-between text-slate-300">
                <span>ยอดรวมค่าสินค้า:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>ค่าจัดส่ง ({fulfillmentType === FulfillmentType.DELIVERY ? "พัสดุด่วน" : "รับที่ร้าน"}):</span>
                <span className={`font-mono ${shippingFee === 0 ? "text-emerald-400 font-bold" : ""}`}>
                  {shippingFee === 0 ? "ฟรี (฿0)" : formatCurrency(shippingFee)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-gold-500/30 flex items-center justify-between mt-3">
                <div>
                  <span className="text-xs text-slate-400 block">ยอดชำระสุทธิ</span>
                  <span className="text-2xl font-extrabold text-gold-300">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-medium border border-amber-500/40">
                    <Clock className="w-3 h-3" />
                    <span>ล็อคสต็อก 15 นาที</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
              <QrCode className="w-6 h-6 text-gold-400 flex-shrink-0" />
              <div>
                <strong className="text-slate-100 block">ชำระผ่าน PromptPay QR ยอดตรงอัตโนมัติ</strong>
                <p className="text-[11px] text-slate-400">
                  ระบบจะสร้าง QR Code พร้อมยอด {formatCurrency(grandTotal)} ให้สแกนในหน้าถัดไป
                </p>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold-glow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังสร้างคำสั่งซื้อและล็อคสต็อก...</span>
                </>
              ) : (
                <>
                  <span>ยืนยันคำสั่งซื้อ & สร้าง QR ชำระเงิน</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
