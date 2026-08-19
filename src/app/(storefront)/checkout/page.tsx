"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { FulfillmentType } from "@prisma/client";
import { createOrderAction, getCurrentUserAction } from "@/lib/actions";
import { formatCurrency, cleanPhoneNumber, isValidThaiPhone } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
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
  LogIn,
  UserPlus,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(
    FulfillmentType.DELIVERY
  );
  const [shippingAddress, setShippingAddress] = useState("");
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    setCheckingAuth(true);
    try {
      const res = await getCurrentUserAction();
      if (res.success && res.user) {
        setUser(res.user);
        useAuthStore.getState().setUser(res.user as any);
        // Pre-fill profile data automatically
        setCustomerName(res.user.name || "");
        setCustomerPhone(cleanPhoneNumber(res.user.phone || ""));
        setCustomerEmail(res.user.email || "");
        setShippingAddress(res.user.address || "");
      } else {
        setUser(null);
        useAuthStore.getState().setUser(null);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      setUser(null);
      useAuthStore.getState().setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = cleanPhoneNumber(e.target.value);
    setCustomerPhone(clean);
  };

  if (!mounted || checkingAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">กำลังตรวจสอบข้อมูลสมาชิก...</p>
      </div>
    );
  }

  // If user is not logged in -> display friendly login/register requirement
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400 shadow-gold-glow">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            เพื่อให้ท่านสามารถติดตามสถานะการชำระเงิน ตรวจสอบหมายเลขพัสดุ และสะสมสิทธิประโยชน์ กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนดำเนินการ
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f1728] border border-slate-800 text-xs text-amber-200 flex items-center justify-center gap-2 max-w-md mx-auto">
          <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <span>สินค้าในตะกร้าของท่าน ({getTotalItems()} รายการ) จะยังคงอยู่ครบถ้วน</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
          <Link
            href="/login?redirect=/checkout"
            className="w-full sm:w-1/2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-gold-glow transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบ</span>
          </Link>
          <Link
            href="/register?redirect=/checkout"
            className="w-full sm:w-1/2 py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>สมัครสมาชิกใหม่</span>
          </Link>
        </div>
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
          className="inline-block px-6 py-3 rounded-xl bg-gold-500 text-slate-950 font-bold text-sm shadow-gold-glow"
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
      setErrorMessage("กรุณาระบุชื่อ-นามสกุลของผู้รับสินค้า");
      return;
    }

    const clean = cleanPhoneNumber(customerPhone);
    if (!clean || !isValidThaiPhone(clean)) {
      setErrorMessage("กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง (เฉพาะตัวเลข 9-10 หลัก เช่น 0812345678)");
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
        customerPhone: clean,
        customerEmail: customerEmail.trim() || undefined,
        fulfillmentType,
        shippingAddress:
          fulfillmentType === FulfillmentType.DELIVERY ? shippingAddress.trim() : undefined,
        saveAddressToProfile,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });

      if (!result.success || !result.order) {
        if (result.requireAuth) {
          router.push("/login?redirect=/checkout");
          return;
        }
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
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Lock className="w-7 h-7 text-gold-400" />
            <span>ชำระเงินและยืนยันคำสั่งซื้อ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ระบบจะทำการล็อคสต็อกสินค้าให้ท่านทันทีเป็นเวลา 15 นาทีหลังจากกดยืนยันคำสั่งซื้อ
          </p>
        </div>

        {/* User Logged In Badge */}
        <div className="flex items-center gap-2.5 bg-[#131b2e] py-1.5 px-3.5 rounded-xl border border-gold-500/30 text-xs text-slate-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>สั่งซื้อในนาม: <strong className="text-gold-300">{user.name}</strong></span>
        </div>
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gold-300 uppercase tracking-wider block">
                2. ข้อมูลผู้สั่งซื้อ & การจัดส่ง
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold-400" />
                <span>ดึงข้อมูลจากโปรไฟล์อัตโนมัติ</span>
              </span>
            </div>

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
                {/* Phone (Numeric Only) */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gold-400" />
                      <span>เบอร์โทรศัพท์ (ตัวเลขเท่านั้น) *</span>
                    </span>
                    <span className="text-[10px] text-gold-400 font-mono">
                      {customerPhone.length}/10
                    </span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    placeholder="เช่น 0812345678"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-gold-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">กรอกเฉพาะตัวเลข 9-10 หลัก</p>
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
                <div className="space-y-2">
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

                  {/* Save address to profile checkbox */}
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-gold-500 focus:ring-gold-400"
                    />
                    <span>บันทึกที่อยู่นี้เป็นที่อยู่เริ่มต้นในโปรไฟล์ของฉัน</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Summary & Payment Instructions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f1728] border border-slate-800 shadow-2xl space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>สรุปรายการสั่งซื้อ ({getTotalItems()} รายการ)</span>
            </h2>

            {/* Item list snapshot */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-center justify-between gap-3 text-xs border-b border-slate-800/60 pb-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                      <Image
                        src={item.image || "/logos/sp-logo.png"}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.variantName} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 font-mono font-bold text-slate-200">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>ราคารวมสินค้า:</span>
                <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ค่าจัดส่ง:</span>
                <span className="font-mono text-slate-200">
                  {shippingFee > 0 ? formatCurrency(shippingFee) : "ฟรี (รับที่ร้าน)"}
                </span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold pt-3 border-t border-slate-800 text-white">
                <span>ยอดชำระสุทธิ:</span>
                <span className="gold-gradient-text text-lg sm:text-xl font-mono">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Clock className="w-3.5 h-3.5" />
                <span>ขั้นตอนหลังกดยืนยันคำสั่งซื้อ:</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-5">
                ระบบจะสร้าง <strong>PromptPay QR Code</strong> ที่มียอดเงินตรงกับออเดอร์ทันที เพื่อให้ท่านสแกนชำระเงินและแนบสลิปโอนเงิน โดยล็อคสต็อกไว้ 15 นาที
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-gold-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังล็อคสต็อกและสร้างคำสั่งซื้อ...</span>
                </div>
              ) : (
                <>
                  <span>ยืนยันคำสั่งซื้อ ({formatCurrency(grandTotal)})</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
