"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OrderStatus, FulfillmentType } from "@prisma/client";
import {
  formatCurrency,
  formatDateThai,
  getOrderStatusInfo,
  formatPhoneNumber,
} from "@/lib/utils";
import { cancelOrderAction } from "@/lib/actions";
import { SlipViewerModal } from "@/components/admin/SlipViewerModal";
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  RefreshCw,
  Eye,
  AlertTriangle,
  XCircle,
  FileCheck,
} from "lucide-react";

interface OrderItemRow {
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
      name: string;
      product: {
        name: string;
        code: string;
      };
    };
  }[];
}

export function OrderManagerClient({
  initialOrders,
}: {
  initialOrders: OrderItemRow[];
}) {
  const [orders, setOrders] = useState<OrderItemRow[]>(initialOrders);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<OrderItemRow | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  // Status Filter Tabs
  const statusTabs = [
    { key: "ALL", label: "ทั้งหมด" },
    { key: OrderStatus.PENDING_VERIFICATION, label: "รอตรวจสอบสลิป" },
    { key: OrderStatus.PENDING_PAYMENT, label: "รอชำระเงิน" },
    { key: OrderStatus.PAID, label: "ชำระเงินแล้ว" },
    { key: OrderStatus.READY_FOR_PICKUP, label: "พร้อมรับที่ร้าน" },
    { key: OrderStatus.SHIPPED, label: "จัดส่งแล้ว" },
    { key: OrderStatus.CANCELLED, label: "ยกเลิกแล้ว" },
  ];

  // Manual Trigger Auto Cleanup Cron
  const handleTriggerCleanup = async () => {
    setCleaningUp(true);
    setCleanupMessage(null);
    try {
      const res = await fetch("/api/cron/cleanup-orders", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCleanupMessage(
          `คืนสต็อกสำเร็จ: ยกเลิก ${data.cancelledCount} ออเดอร์ คืนสต็อก ${data.restoredBaseUnits} ซอง`
        );
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setCleanupMessage(data.error || "ไม่พบออเดอร์ที่หมดเวลา");
      }
    } catch (err: any) {
      setCleanupMessage("เกิดข้อผิดพลาดในการรันคำสั่งคืนสต็อก");
    } finally {
      setCleaningUp(false);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`คุณต้องการยกเลิกคำสั่งซื้อ #${orderNumber} และคืนสต็อกใช่หรือไม่?`)) return;
    try {
      const res = await cancelOrderAction(orderId);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert("ยกเลิกคำสั่งซื้อไม่สำเร็จ");
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchStatus = selectedStatus === "ALL" || o.status === selectedStatus;
    const matchQuery =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery);
    return matchStatus && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-gold-400" />
            <span>คำสั่งซื้อ & ตรวจสอบสลิปโอนเงิน</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ตรวจสลิปยืนยันยอดเงิน อนุมัติการจัดส่ง และระบุหมายเลขพัสดุ
          </p>
        </div>

        <button
          onClick={handleTriggerCleanup}
          disabled={cleaningUp}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm self-start sm:self-center"
          title="รันระบบตรวจสอบออเดอร์ค้างเกิน 15 นาที และคืนสต็อกอัตโนมัติ"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold-400 ${cleaningUp ? "animate-spin" : ""}`} />
          <span>{cleaningUp ? "กำลังตรวจสอบ..." : "⚡ คืนสต็อกออเดอร์หมดเวลา (Run Cleanup)"}</span>
        </button>
      </div>

      {cleanupMessage && (
        <div className="p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-gold-400" />
          <span>{cleanupMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {statusTabs.map((tab) => {
            const count =
              tab.key === "ALL"
                ? orders.length
                : orders.filter((o) => o.status === tab.key).length;
            const isSelected = selectedStatus === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-gold-500 text-slate-950 font-bold shadow-gold-glow"
                    : "bg-[#0e1628] text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="ค้นหาเลขคำสั่งซื้อ, ชื่อ, เบอร์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e1628] border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-gold-400"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-6 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">หมายเลขคำสั่งซื้อ</th>
                <th className="pb-3 font-semibold">ลูกค้า & เบอร์โทร</th>
                <th className="pb-3 font-semibold">การรับสินค้า</th>
                <th className="pb-3 font-semibold">ยอดชำระ</th>
                <th className="pb-3 font-semibold">สถานะ</th>
                <th className="pb-3 font-semibold text-center">สลิปโอนเงิน</th>
                <th className="pb-3 font-semibold text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ไม่พบรายการคำสั่งซื้อในสถานะนี้
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = getOrderStatusInfo(order.status);

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5">
                        <Link
                          href={`/orders/${order.id}`}
                          target="_blank"
                          className="font-mono font-bold text-slate-200 hover:text-gold-300 transition-colors"
                        >
                          {order.orderNumber}
                        </Link>
                        <div className="text-[10px] text-slate-400">
                          {formatDateThai(order.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5">
                        <div className="font-semibold text-slate-100">{order.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {formatPhoneNumber(order.customerPhone)}
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span className="text-[11px] text-slate-300 flex items-center gap-1">
                          {order.fulfillmentType === FulfillmentType.DELIVERY ? (
                            <>
                              <Truck className="w-3 h-3 text-blue-400" />
                              <span>จัดส่งพัสดุ</span>
                            </>
                          ) : (
                            <>
                              <Store className="w-3 h-3 text-purple-400" />
                              <span>รับที่ร้าน</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 font-mono font-bold text-gold-300">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 text-center">
                        {order.paymentSlipUrl ? (
                          <button
                            onClick={() => {
                              setSelectedOrderForSlip(order);
                              setIsSlipModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>ดูสลิป</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">ยังไม่แนบ</span>
                        )}
                      </td>

                      <td className="py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedOrderForSlip(order);
                            setIsSlipModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gold-300 text-xs inline-flex items-center gap-1"
                          title="เปิดตรวจ / บันทึกเลขพัสดุ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>จัดการ</span>
                        </button>

                        {order.status !== OrderStatus.CANCELLED && (
                          <button
                            onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs"
                            title="ยกเลิกออเดอร์ & คืนสต็อก"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Viewer Modal Component */}
      {selectedOrderForSlip && (
        <SlipViewerModal
          order={selectedOrderForSlip as any}
          isOpen={isSlipModalOpen}
          onClose={() => setIsSlipModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
