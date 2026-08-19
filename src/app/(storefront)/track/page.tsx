"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Package, Phone, ArrowRight, ShieldCheck } from "lucide-react";

export default function TrackPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const term = searchTerm.trim();

    if (!term) {
      setError("กรุณากรอกหมายเลขคำสั่งซื้อ (เช่น SP-20260818-0001) หรือ เบอร์โทรศัพท์");
      return;
    }

    // Direct redirect to order page
    router.push(`/orders/${encodeURIComponent(term)}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400">
          <Search className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          ตรวจสอบสถานะคำสั่งซื้อ
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          กรอกหมายเลขคำสั่งซื้อที่ได้รับเพื่อดูสถานะการชำระเงินและหมายเลขพัสดุ หรือ{" "}
          <Link href="/profile?tab=orders" className="text-gold-400 hover:text-gold-300 font-bold underline underline-offset-2">
            ดูประวัติคำสั่งซื้อทั้งหมดในโปรไฟล์
          </Link>
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#0f1728] border border-slate-800 shadow-2xl space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              หมายเลขคำสั่งซื้อ (Order Number)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="เช่น SP-20260818-0001"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-gold-400 font-mono"
              />
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-gold-glow transition-all"
          >
            <span>ค้นหาคำสั่งซื้อ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-300">ตัวอย่างคำสั่งซื้อทดสอบในระบบ:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSearchTerm("SP-20260818-0001");
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-gold-300 font-mono text-[11px]"
            >
              SP-20260818-0001 (รอตรวจสลิป)
            </button>
            <button
              onClick={() => {
                setSearchTerm("SP-20260818-0002");
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-gold-300 font-mono text-[11px]"
            >
              SP-20260818-0002 (พร้อมรับที่ร้าน)
            </button>
            <button
              onClick={() => {
                setSearchTerm("SP-20260818-0003");
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-gold-300 font-mono text-[11px]"
            >
              SP-20260818-0003 (จัดส่งแล้ว)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
