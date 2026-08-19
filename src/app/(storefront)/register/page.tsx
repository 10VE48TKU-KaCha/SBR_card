"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { registerCustomerAction } from "@/lib/actions";
import { cleanPhoneNumber, isValidThaiPhone } from "@/lib/utils";
import {
  UserPlus,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phone input handler strictly enforcing numeric digits only
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleanDigits = cleanPhoneNumber(rawValue);
    setPhone(cleanDigits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    if (!phone || !isValidThaiPhone(phone)) {
      setErrorMessage("กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง (เฉพาะตัวเลข 9-10 หลัก เช่น 0812345678)");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("กรุณาระบุรูปแบบอีเมลให้ถูกต้อง");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const result = await registerCustomerAction({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        address: address.trim() || undefined,
      });

      if (!result.success) {
        setErrorMessage(result.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
        setLoading(false);
        return;
      }

      // Successful registration & auto-login
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#0f1728] border border-gold-500/30 shadow-2xl shadow-black/80 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400 shadow-gold-glow">
          <UserPlus className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          สมัครสมาชิกใหม่
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          สร้างบัญชีเพื่อสั่งซื้อการ์ดเกมแท้ สะสมแต้ม และติดตามคำสั่งซื้อได้สะดวกรวดเร็ว
        </p>
      </div>

      {redirectPath === "/checkout" && (
        <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <span>หลังจากสมัครสมาชิกแล้ว ระบบจะนำท่านกลับไปยังหน้าชำระเงินทันที</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            ชื่อ-นามสกุล *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="เช่น สมชาย สุภาพบุรุษ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40 transition-all"
            />
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Phone & Email Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone (Numbers Only) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
              <span>เบอร์โทรศัพท์ (ตัวเลขเท่านั้น) *</span>
              <span className="text-[10px] text-gold-400/80 font-mono">
                {phone.length}/10
              </span>
            </label>
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                required
                placeholder="เช่น 0812345678"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40 transition-all font-mono"
              />
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">กรอกตัวเลข 9-10 หลัก</p>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              อีเมล *
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
        </div>

        {/* Password Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              รหัสผ่าน (อย่างน้อย 6 ตัว) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
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
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              ยืนยันรหัสผ่าน *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40 transition-all font-mono"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold-300 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Shipping Address (Optional on register) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold-400" />
              <span>ที่อยู่จัดส่งพัสดุเริ่มต้น (ระบุหรือไม่ระบุก็ได้)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">(สามารถแก้ไขภายหลังได้)</span>
          </label>
          <textarea
            rows={2}
            placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40 transition-all"
          />
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
              <span>สมัครสมาชิกและเข้าสู่ระบบทันที</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-4 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-400">
          มีบัญชีสมาชิกอยู่แล้ว?{" "}
          <Link
            href={`/login${redirectPath !== "/" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="text-gold-400 hover:text-gold-300 font-bold underline underline-offset-4"
          >
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
