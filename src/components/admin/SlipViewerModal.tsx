"use client";

import React, { useState } from "react";
import Image from "next/image";
import { OrderStatus, FulfillmentType } from "@prisma/client";
import { formatCurrency, formatDateThai, formatPhoneNumber } from "@/lib/utils";
import { verifyOrderPaymentAction, updateOrderTrackingAction } from "@/lib/actions";
import {
  X,
  CheckCircle2,
  Truck,
  Store,
  ZoomIn,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Package,
} from "lucide-react";

interface SlipViewerModalProps {
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
    trackingNumber: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SlipViewerModal({ order, isOpen, onClose, onSuccess }: SlipViewerModalProps) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyOrderPaymentAction(order.id);
      if (!res.success) throw new Error(res.error || "เกิดข้อผิดพลาด");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!trackingNumber.trim()) {
      setError("กรุณาระบุหมายเลขพัสดุ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await updateOrderTrackingAction(order.id, trackingNumber);
      if (!res.success) throw new Error(res.error || "เกิดข้อผิดพลาด");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#0e1628] border border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                ตรวจสอบหลักฐานการชำระเงิน #{order.orderNumber}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/30">
                {order.fulfillmentType === FulfillmentType.DELIVERY ? "จัดส่งพัสดุ" : "รับที่หน้าร้าน"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ลูกค้า: {order.customerName} ({formatPhoneNumber(order.customerPhone)})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Slip Preview (Clean, Unwatermarked) */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              รูปภาพสลิปที่ลูกค้าแนบมา:
            </label>
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
              {order.paymentSlipUrl ? (
                <Image
                  src={order.paymentSlipUrl}
                  alt="Payment Slip"
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs p-4">
                  ยังไม่ได้แนบสลิปการโอนเงิน
                </div>
              )}
            </div>
          </div>

          {/* Right: Order details & Action Buttons */}
          <div className="md:col-span-6 space-y-4">
            <div className="p-4 rounded-2xl bg-[#141e33] border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>ยอดเงินที่ต้องตรงกัน:</span>
                <span className="text-base font-bold text-gold-300">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>สถานะคำสั่งซื้อ:</span>
                <span className="text-slate-200 font-semibold">{order.status}</span>
              </div>
              {order.shippingAddress && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block mb-1">ที่อยู่จัดส่ง:</span>
                  <p className="text-slate-300 leading-relaxed bg-[#0b0f19] p-2 rounded-lg">
                    {order.shippingAddress}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </p>
            )}

            {/* Actions for Status Transitions */}
            {order.status === OrderStatus.PENDING_VERIFICATION && (
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleVerifyPayment}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    อนุมัติยอดเงิน (
                    {order.fulfillmentType === FulfillmentType.STORE_PICKUP
                      ? "เปลี่ยนเป็น พร้อมรับที่ร้าน"
                      : "เปลี่ยนเป็น ชำระเงินแล้ว"}
                    )
                  </span>
                </button>
              </div>
            )}

            {/* Shipping tracking input */}
            {(order.status === OrderStatus.PAID ||
              order.status === OrderStatus.PREPARING ||
              order.status === OrderStatus.SHIPPED) &&
              order.fulfillmentType === FulfillmentType.DELIVERY && (
                <div className="p-4 rounded-2xl bg-[#090e1a] border border-cyan-500/30 space-y-3">
                  <label className="text-xs font-bold text-cyan-300 block">
                    บันทึกหมายเลขพัสดุ (Tracking Number)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น TH01928374659B"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="flex-1 bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={handleSaveTracking}
                      disabled={loading || !trackingNumber.trim()}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors disabled:opacity-40"
                    >
                      บันทึก & จัดส่ง
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
