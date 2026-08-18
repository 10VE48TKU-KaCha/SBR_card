"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Settings,
  Globe,
  Shield,
  ExternalLink,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logoutAdminAction } from "@/lib/actions";

export function AdminSidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin/dashboard",
      label: "แดชบอร์ดภาพรวม",
      icon: LayoutDashboard,
      desc: "ยอดขาย & สถิติ",
    },
    {
      href: "/admin/products",
      label: "จัดการสินค้า & ลายน้ำ",
      icon: Package,
      desc: "CRUD & Packaging Ratios",
    },
    {
      href: "/admin/inventory",
      label: "สต็อก & เครื่องคิดเลขรับของ",
      icon: Boxes,
      desc: "สูตรคำนวณ ลัง/กล่อง/ซอง",
    },
    {
      href: "/admin/orders",
      label: "คำสั่งซื้อ & ตรวจสอบสลิป",
      icon: ShoppingCart,
      desc: "สลิปโอนเงิน & หมายเลขพัสดุ",
    },
    {
      href: "/admin/settings",
      label: "ตั้งค่าร้าน & ติดต่อหน้าร้าน",
      icon: Settings,
      desc: "ที่อยู่, เบอร์โทร, เวลาเปิดบริการ",
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gold-400 shadow-gold-glow flex-shrink-0">
            <Image src="/logos/sp-logo.png" alt="Admin Logo" fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-gold-300">ADMIN PORTAL</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-400">ร้านสุภาพบุรุษ</span>
          </div>
        </div>

        {/* Quick View Store Action Button */}
        <Link
          href="/"
          target="_blank"
          onClick={onItemClick}
          className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-gold-500/20 via-amber-500/10 to-transparent border border-gold-500/40 text-gold-300 hover:text-gold-200 hover:border-gold-400 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-gold-400 group-hover:rotate-12 transition-transform" />
            <div className="text-left">
              <span className="text-xs font-bold block">🌐 ดูหน้าร้าน (View Store)</span>
              <span className="text-[10px] text-slate-400">เปิดหน้าต่างใหม่</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
        </Link>

        {/* Navigation links */}
        <nav className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
            ระบบจัดการ
          </span>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onItemClick}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gold-500 text-slate-950 font-bold shadow-gold-glow"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-gold-400"}`} />
                <div className="flex-1">
                  <div>{link.label}</div>
                  <div
                    className={`text-[10px] font-normal ${
                      isActive ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {link.desc}
                  </div>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile Footer & Logout Button */}
      <div className="space-y-2 pt-4">
        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-200 block text-[11px]">เถ้าแก่สุภาพบุรุษ</span>
              <span className="text-[10px] text-emerald-400">Master Admin</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => logoutAdminAction()}
          className="w-full p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ (Logout)</span>
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden md:block w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex-shrink-0 min-h-screen">
      <AdminSidebarContent />
    </aside>
  );
}

export function AdminNavbar() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-[#090d18] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl bg-[#131b2e] border border-slate-700 text-slate-200 hover:text-white"
            aria-label="เปิดเมนูการจัดการ"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono text-slate-400">SUPAPBURUT CONTROL CENTER</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">🌐 ดูหน้าร้าน (View Store)</span>
            <span className="sm:hidden">หน้าร้าน</span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 bg-[#0a0f1d] h-full shadow-2xl flex flex-col z-10 border-r border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="font-bold text-xs text-gold-300">ADMIN MENU</span>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebarContent onItemClick={() => setIsMobileDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
