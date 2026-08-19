"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginCustomerAction } from "@/lib/actions";
import { Lock, Mail, Eye, EyeOff, LogIn, ArrowRight, ShieldCheck, UserPlus, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    setLoading(true);

    try {
      const result = await loginCustomerAction(email, password);
      if (!result.success) {
        setErrorMessage(result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      // Successful login
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0f1728] border border-gold-500/30 shadow-2xl shadow-black/80 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400 shadow-gold-glow">
          <LogIn className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          เข้าสู่ระบบลูกค้า
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {redirectPath === "/checkout"
            ? "กรุณาเข้าสู่ระบบเพื่อดำเนินการสั่งซื้อและติดตามพัสดุ"
            : "เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อและข้อมูลที่อยู่จัดส่ง"}
        </p>
      </div>

      {redirectPath === "/checkout" && (
        <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <span>หลังจากเข้าสู่ระบบแล้ว ระบบจะนำท่านกลับไปยังหน้าชำระเงินทันที</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            อีเมล (Email) *
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="somchai@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40 transition-all"
            />
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Password with Eye toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              รหัสผ่าน (Password) *
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40 transition-all font-mono"
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold-300 transition-colors p-1"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-gold-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="pt-4 border-t border-slate-800 text-center space-y-3">
        <p className="text-xs text-slate-400">
          ยังไม่มีบัญชีสมาชิก?{" "}
          <Link
            href={`/register${redirectPath !== "/" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="text-gold-400 hover:text-gold-300 font-bold underline underline-offset-4"
          >
            สมัครสมาชิกใหม่ที่นี่
          </Link>
        </p>
        <div>
          <Link
            href="/admin/login"
            className="text-[11px] text-slate-400 hover:text-slate-400 transition-colors"
          >
            🔒 เข้าสู่ระบบสำหรับผู้ดูแลร้าน (Admin)
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
