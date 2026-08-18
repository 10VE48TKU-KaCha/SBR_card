import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { OrderStatus, FulfillmentType } from "@prisma/client";
import { formatCurrency, formatDateThai, getOrderStatusInfo } from "@/lib/utils";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Boxes,
  ArrowRight,
  Globe,
  RefreshCw,
  Eye,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Fetch real statistics from database with fallbacks
  let totalOrders = 0;
  let pendingVerificationOrders = 0;
  let pendingPaymentOrders = 0;
  let paidOrders: any[] = [];
  let totalProducts = 0;
  let recentOrders: any[] = [];
  let lowStockProducts: any[] = [];

  try {
    const res = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING_VERIFICATION } }),
      prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
      prisma.order.findMany({
        where: {
          status: { in: [OrderStatus.PAID, OrderStatus.READY_FOR_PICKUP, OrderStatus.SHIPPED] },
        },
        select: { totalAmount: true },
      }),
      prisma.product.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              variant: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        where: { baseStock: { lte: 16 } },
        take: 4,
      }),
    ]);
    totalOrders = res[0];
    pendingVerificationOrders = res[1];
    pendingPaymentOrders = res[2];
    paidOrders = res[3];
    totalProducts = res[4];
    recentOrders = res[5];
    lowStockProducts = res[6];
  } catch (error) {
    console.error("AdminDashboard data fetch error:", error);
  }

  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            แดชบอร์ดภาพรวม (Store Overview)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            สรุปสถานะการสั่งซื้อ สต็อก และความเคลื่อนไหวของร้านสุภาพบุรุษ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/40 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Globe className="w-4 h-4" />
            <span>🌐 ดูหน้าร้าน (View Store)</span>
          </Link>

          <Link
            href="/admin/products"
            className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-gold-glow transition-all"
          >
            <Package className="w-4 h-4" />
            <span>+ เพิ่มสินค้าใหม่</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="p-5 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">ยอดขายยืนยันแล้ว</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400">จากออเดอร์ที่ตรวจสอบเรียบร้อย</div>
        </div>

        {/* Pending Verification (Urgent) */}
        <Link
          href="/admin/orders"
          className="p-5 rounded-3xl bg-gradient-to-br from-[#18233c] to-[#0e1628] border border-blue-500/40 hover:border-blue-400 transition-all space-y-3 block shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300">สลิปรอตรวจสอบ</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-300 flex items-baseline gap-2">
            <span>{pendingVerificationOrders}</span>
            <span className="text-xs font-normal text-slate-400">รายการ</span>
          </div>
          <div className="text-[11px] text-blue-200/80 flex items-center gap-1">
            <span>คลิกเพื่อตรวจสอบสลิป</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Total Products */}
        <div className="p-5 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">สินค้าในระบบ</span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{totalProducts} รายการ</div>
          <div className="text-[11px] text-slate-400">พร้อมสต็อกเชื่อมโยง ลัง/กล่อง/ซอง</div>
        </div>

        {/* Pending Payment / Expiring */}
        <div className="p-5 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">รอชำระเงิน (15 นาที)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{pendingPaymentOrders} รายการ</div>
          <div className="text-[11px] text-slate-400">ระบบจะคืนสต็อกอัตโนมัติเมื่อหมดเวลา</div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gold-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">คำสั่งซื้อล่าสุด</h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1"
          >
            <span>ดูคำสั่งซื้อทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">หมายเลขคำสั่งซื้อ</th>
                <th className="pb-3 font-semibold">ลูกค้า</th>
                <th className="pb-3 font-semibold">การรับสินค้า</th>
                <th className="pb-3 font-semibold">ยอดรวม</th>
                <th className="pb-3 font-semibold">สถานะ</th>
                <th className="pb-3 font-semibold text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentOrders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status);
                return (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-slate-200">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5">
                      <div className="font-semibold text-slate-200">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.customerPhone}</div>
                    </td>
                    <td className="py-3.5">
                      <span className="text-[11px] text-slate-300">
                        {order.fulfillmentType === FulfillmentType.DELIVERY
                          ? "จัดส่งพัสดุ"
                          : "รับที่ร้านสุภาพบุรุษ"}
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
                    <td className="py-3.5 text-right">
                      <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold-400" />
                        <span>เปิดตรวจ</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
