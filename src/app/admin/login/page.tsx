"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { loginAdminAction } from "@/lib/actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginAdminAction(email, password);
      if (res.success) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError(res.error || "อีเมล หรือ รหัสผ่าน ไม่ถูกต้อง");
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#0e1628]/90 border border-gold-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-gold-400 shadow-gold-glow">
            <Image
              src="/logos/sp-logo.png"
              alt="ร้านสุภาพบุรุษ Admin Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold gold-gradient-text tracking-tight">
              ADMIN CONTROL CENTER
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              ระบบหลังร้านสุภาพบุรุษ (Supapburut Toys & Cards)
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              อีเมลผู้ดูแลระบบ (Admin Email)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4 text-gold-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@supapburut.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-gold-400 text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-gold-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-gold-400 text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-gold-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>กำลังตรวจสอบข้อมูล...</span>
            ) : (
              <>
                <span>เข้าสู่ระบบหลังร้าน</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-800/80">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-gold-300 transition-colors inline-flex items-center gap-1"
          >
            <span>← กลับสู่หน้าแรกของร้าน</span>
          </a>
        </div>
      </div>
    </div>
  );
}
