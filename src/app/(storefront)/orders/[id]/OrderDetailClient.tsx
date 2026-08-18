"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { OrderStatus, FulfillmentType } from "@prisma/client";
import {
  formatCurrency,
  formatDateThai,
  getOrderStatusInfo,
  formatPhoneNumber,
} from "@/lib/utils";
import { uploadPaymentSlipAction } from "@/lib/actions";
import {
  QrCode,
  Clock,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Store,
  Package,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  FileCheck,
} from "lucide-react";
import confetti from "canvas-confetti";

interface OrderDetailClientProps {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    shippingAddress: string | null;
    fulfillmentType: FulfillmentType;
    status: OrderStatus;
    totalAmount: number;
    shippingFee: number;
    paymentSlipUrl: string | null;
    paidAt: string | null;
    expiresAt: string;
    trackingNumber: string | null;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      deductedBaseUnits: number;
      variant: {
        id: string;
        name: string;
        sku: string;
        product: {
          id: string;
          code: string;
          name: string;
          images: string[];
        };
      };
    }[];
  };
  promptPay: {
    payload: string;
    qrDataUrl: string;
    amount: number;
    recipient: string;
    formattedRecipient: string;
  };
}

export function OrderDetailClient({ order: initialOrder, promptPay }: OrderDetailClientProps) {
  const [order, setOrder] = useState(initialOrder);
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // 15-Minute Countdown Timer calculation
  useEffect(() => {
    const updateCountdown = () => {
      const expiry = new Date(order.expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
      } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ minutes: mins, seconds: secs, isExpired: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [order.expiresAt]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  const handleUploadSlip = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Upload clean slip file without watermark to /api/upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "slip");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "อัปโหลดสลิปไม่สำเร็จ");
      }

      // 2. Attach slip URL to Order
      const result = await uploadPaymentSlipAction(order.id, uploadData.url);
      if (!result.success) {
        throw new Error(result.error || "ไม่สามารถบันทึกข้อมูลสลิปได้");
      }

      // Success - update local state and fire celebratory confetti
      setOrder((prev) => ({
        ...prev,
        status: OrderStatus.PENDING_VERIFICATION,
        paymentSlipUrl: uploadData.url,
      }));

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } catch (err: any) {
      setUploadError(err.message || "เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string, type: "promptpay" | "amount") => {
    navigator.clipboard.writeText(text);
    if (type === "promptpay") {
      setCopiedPromptPay(true);
      setTimeout(() => setCopiedPromptPay(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const statusInfo = getOrderStatusInfo(order.status);

  // Status timeline steps
  const steps = [
    { key: OrderStatus.PENDING_PAYMENT, label: "สร้างคำสั่งซื้อ" },
    { key: OrderStatus.PENDING_VERIFICATION, label: "รอตรวจสอบสลิป" },
    { key: OrderStatus.PAID, label: "ชำระเงินเรียบร้อย" },
    {
      key: order.fulfillmentType === FulfillmentType.STORE_PICKUP ? OrderStatus.READY_FOR_PICKUP : OrderStatus.SHIPPED,
      label: order.fulfillmentType === FulfillmentType.STORE_PICKUP ? "พร้อมรับที่ร้าน" : "จัดส่งแล้ว",
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return 0;
      case OrderStatus.PENDING_VERIFICATION:
        return 1;
      case OrderStatus.PAID:
      case OrderStatus.PREPARING:
        return 2;
      case OrderStatus.READY_FOR_PICKUP:
      case OrderStatus.SHIPPED:
        return 3;
      case OrderStatus.CANCELLED:
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar with Order Number & Back link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-gold-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              คำสั่งซื้อ #{order.orderNumber}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            สร้างเมื่อ: {formatDateThai(order.createdAt)}
          </p>
        </div>

        {/* Tracking Number if Shipped */}
        {order.trackingNumber && (
          <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-300">
            <div className="flex items-center gap-2 font-bold">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>หมายเลขพัสดุ: {order.trackingNumber}</span>
            </div>
            <p className="text-[11px] text-cyan-200/80 mt-1">
              ตรวจสอบสถานะการนำส่งได้ที่เว็บไซต์ Kerry Express / Flash / ไปรษณีย์ไทย
            </p>
          </div>
        )}
      </div>

      {/* Progress Stepper Bar */}
      {order.status !== OrderStatus.CANCELLED && (
        <div className="p-6 rounded-3xl bg-[#0f1728] border border-slate-800">
          <div className="grid grid-cols-4 gap-2 text-center relative">
            {steps.map((step, idx) => {
              const isCompleted = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.key} className="flex flex-col items-center space-y-2 relative z-10">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-all ${
                      isCompleted
                        ? "bg-gold-500 text-slate-950 border-gold-400 shadow-gold-glow"
                        : "bg-[#141d30] text-slate-400 border-slate-700"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold ${
                      isCurrent
                        ? "text-gold-300"
                        : isCompleted
                        ? "text-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Grid: Left QR & Slip / Right Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dynamic PromptPay QR & Slip Uploader */}
        <div className="lg:col-span-6 space-y-6">
          {/* Order Pending Payment Card */}
          {order.status === OrderStatus.PENDING_PAYMENT && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#152038] to-[#0c1322] border border-gold-500/40 shadow-2xl space-y-6">
              {/* Expiration Timer Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  timeLeft.isExpired
                    ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                    : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock
                    className={`w-5 h-5 ${
                      timeLeft.isExpired ? "text-rose-400" : "text-amber-400 animate-spin"
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold block">
                      {timeLeft.isExpired
                        ? "หมดเวลาชำระเงิน (คำสั่งซื้อจะถูกยกเลิกอัตโนมัติ)"
                        : "กรุณาชำระเงินและแนบสลิปภายใน"}
                    </span>
                    {!timeLeft.isExpired && (
                      <span className="text-[11px] opacity-80">
                        เพื่อรักษาสิทธิ์สต็อกสินค้าที่ระบบล็อคไว้ให้ท่าน
                      </span>
                    )}
                  </div>
                </div>

                {!timeLeft.isExpired && (
                  <div className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider bg-black/40 px-3 py-1.5 rounded-xl border border-amber-500/30">
                    {String(timeLeft.minutes).padStart(2, "0")}:
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                )}
              </div>

              {/* Dynamic PromptPay QR Code Box */}
              <div className="text-center space-y-4">
                <div className="inline-block p-4 rounded-3xl bg-white shadow-2xl border-4 border-gold-400/80">
                  <Image
                    src={promptPay.qrDataUrl}
                    alt="PromptPay QR Code"
                    width={260}
                    height={260}
                    className="mx-auto rounded-xl"
                    priority
                  />
                  <div className="mt-2 text-slate-900 text-xs font-bold flex items-center justify-center gap-1">
                    <QrCode className="w-4 h-4 text-blue-900" />
                    <span>พร้อมเพย์ • PromptPay</span>
                  </div>
                </div>

                {/* Amount to Pay */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-400 block">ยอดที่ต้องชำระ (ตรงตามเศษสตางค์):</span>
                  <div className="text-3xl font-extrabold text-gold-300 flex items-center justify-center gap-2">
                    <span>{formatCurrency(order.totalAmount)}</span>
                    <button
                      onClick={() => copyToClipboard(order.totalAmount.toString(), "amount")}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      title="คัดลอกยอดเงิน"
                    >
                      {copiedAmount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-300/80">
                    *กรุณาโอนเงินตรงตามยอด {formatCurrency(order.totalAmount)} เพื่อความถูกต้องในการตรวจสอบ
                  </p>
                </div>

                {/* PromptPay Account Details */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800 text-xs text-slate-300 space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ชื่อบัญชี:</span>
                    <strong className="text-slate-100">ร้านสุภาพบุรุษ (Supapburut)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">หมายเลขพร้อมเพย์:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-gold-300">
                      <span>{promptPay.formattedRecipient}</span>
                      <button
                        onClick={() => copyToClipboard(promptPay.recipient, "promptpay")}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                      >
                        {copiedPromptPay ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Slip Upload Box */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                  <Upload className="w-4 h-4 text-gold-400" />
                  <span>แนบสลิปการโอนเงิน (Payment Slip)</span>
                </label>

                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="slip-input"
                    className="hidden"
                  />

                  <label
                    htmlFor="slip-input"
                    className="block p-4 border-2 border-dashed border-slate-700 hover:border-gold-400/80 rounded-2xl text-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-all"
                  >
                    {previewUrl ? (
                      <div className="space-y-2">
                        <div className="relative w-36 h-48 mx-auto rounded-xl overflow-hidden border border-slate-700">
                          <Image src={previewUrl} alt="Slip Preview" fill className="object-cover" />
                        </div>
                        <p className="text-xs text-gold-300 font-medium">คลิกเพื่อเปลี่ยนรูปสลิป</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-200">
                          คลิกเพื่อเลือกรูปภาพสลิป หรือลากไฟล์มาวางที่นี่
                        </p>
                        <p className="text-[10px] text-slate-400">
                          รองรับไฟล์ JPG, PNG (ระบบบันทึกแบบไม่ติดลายน้ำ)
                        </p>
                      </div>
                    )}
                  </label>

                  {uploadError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{uploadError}</span>
                    </p>
                  )}

                  <button
                    onClick={handleUploadSlip}
                    disabled={!selectedFile || uploading}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-gold-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>กำลังส่งหลักฐานสลิป...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>ยืนยันการแนบสลิปโอนเงิน</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Slip Uploaded & Awaiting Verification Card */}
          {order.status === OrderStatus.PENDING_VERIFICATION && (
            <div className="p-6 rounded-3xl bg-[#0f1728] border border-blue-500/40 space-y-5">
              <div className="flex items-center gap-3 text-blue-300">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100">
                    อัปโหลดสลิปเรียบร้อยแล้ว
                  </h3>
                  <p className="text-xs text-slate-400">
                    เจ้าหน้าที่ร้านสุภาพบุรุษกำลังตรวจสอบยอดเงินและจัดเตรียมสินค้า
                  </p>
                </div>
              </div>

              {order.paymentSlipUrl && (
                <div className="p-3 bg-black/40 rounded-2xl border border-slate-800 text-center space-y-2">
                  <span className="text-xs text-slate-400 block">สลิปที่แนบไว้:</span>
                  <div className="relative w-44 h-60 mx-auto rounded-xl overflow-hidden border border-slate-700 shadow-md">
                    <Image
                      src={order.paymentSlipUrl}
                      alt="สลิปการโอนเงิน"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paid / Preparing / Ready for Pickup Card */}
          {(order.status === OrderStatus.PAID ||
            order.status === OrderStatus.PREPARING ||
            order.status === OrderStatus.READY_FOR_PICKUP ||
            order.status === OrderStatus.SHIPPED) && (
            <div className="p-6 rounded-3xl bg-[#0f1728] border border-emerald-500/40 space-y-5">
              <div className="flex items-center gap-3 text-emerald-300">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100">
                    ชำระเงินเรียบร้อยแล้ว
                  </h3>
                  <p className="text-xs text-slate-400">{statusInfo.description}</p>
                </div>
              </div>

              {/* Pickup Address details */}
              {order.fulfillmentType === FulfillmentType.STORE_PICKUP && (
                <div className="p-4 rounded-2xl bg-[#131b2e] border border-purple-500/30 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-purple-300 font-bold">
                    <Store className="w-4 h-4 text-purple-400" />
                    <span>คำแนะนำการรับสินค้าที่หน้าร้าน:</span>
                  </div>
                  <p className="leading-relaxed">
                    สามารถเข้ารับสินค้าได้ที่ <strong>ร้านสุภาพบุรุษ (วังบูรพา-เจริญกรุง)</strong>
                    <br />
                    นำรหัสคำสั่งซื้อ <strong>#{order.orderNumber}</strong> และเบอร์โทรศัพท์{" "}
                    <strong>{order.customerPhone}</strong> มาแสดงต่อเจ้าหน้าที่
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cancelled Order Notice */}
          {order.status === OrderStatus.CANCELLED && (
            <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/40 space-y-3">
              <div className="flex items-center gap-3 text-rose-300">
                <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">คำสั่งซื้อถูกยกเลิกแล้ว</h3>
                  <p className="text-xs text-slate-400">
                    ระบบได้คืนสต็อกสินค้ากลับสู่ร้านค้าเรียบร้อยแล้ว หากต้องการสั่งซื้อกรุณาทำรายการใหม่อีกครั้ง
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Items & Delivery Summary */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f1728] border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>รายการสินค้าที่สั่งซื้อ</span>
              <span className="text-xs font-normal text-gold-400">
                {order.items.length} รายการ
              </span>
            </h2>

            {/* Items */}
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#141d30] border border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                      <Image
                        src={
                          item.variant.product.images[0] ||
                          "/logos/sp-logo.png"
                        }
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {item.variant.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gold-500/10 text-gold-300 border border-gold-500/30">
                          {item.variant.name}
                        </span>
                        <span className="text-[11px] text-slate-400">x {item.quantity}</span>
                      </div>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-gold-300 text-xs sm:text-sm flex-shrink-0">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>ราคารวมสินค้า:</span>
                <span className="font-mono">
                  {formatCurrency(order.totalAmount - order.shippingFee)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>
                  ค่าจัดส่ง (
                  {order.fulfillmentType === FulfillmentType.DELIVERY
                    ? "พัสดุด่วน"
                    : "รับที่ร้านสุภาพบุรุษ"}
                  ):
                </span>
                <span
                  className={`font-mono ${
                    order.shippingFee === 0 ? "text-emerald-400 font-bold" : ""
                  }`}
                >
                  {order.shippingFee === 0 ? "ฟรี (฿0)" : formatCurrency(order.shippingFee)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-gold-500/30 flex items-center justify-between mt-2">
                <span className="text-xs text-slate-300 font-semibold">ยอดสุทธิ:</span>
                <span className="text-2xl font-extrabold text-gold-300">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Summary */}
          <div className="p-6 rounded-3xl bg-[#0f1728] border border-slate-800 space-y-3 text-xs text-slate-300">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
              ข้อมูลผู้รับสินค้า
            </h3>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">ชื่อผู้รับ:</span>
                <span className="font-semibold text-slate-200">{order.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">เบอร์โทรศัพท์:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {formatPhoneNumber(order.customerPhone)}
                </span>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-1">ที่อยู่จัดส่งพัสดุ:</span>
                <p className="text-slate-200 leading-relaxed bg-[#131b2e] p-3 rounded-xl border border-slate-800">
                  {order.shippingAddress}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
