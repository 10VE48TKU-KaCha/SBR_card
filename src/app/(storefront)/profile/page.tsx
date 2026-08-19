"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCurrentUserAction,
  updateCustomerProfileAction,
  changeCustomerPasswordAction,
  getCustomerOrdersAction,
  logoutCustomerAction,
} from "@/lib/actions";
import {
  cleanPhoneNumber,
  isValidThaiPhone,
  formatCurrency,
  formatDateThai,
  formatPhoneNumber,
  getOrderStatusLabel,
  getOrderStatusBadgeStyle,
} from "@/lib/utils";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronRight,
  ExternalLink,
  Copy,
  QrCode,
  Truck,
  Store,
  Eye,
  EyeOff,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "orders" ? "orders" : "profile";

  const [activeTab, setActiveTab] = useState<"profile" | "orders">(initialTab);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  // Profile Edit Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Orders Filter
  const [orderFilter, setOrderFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userRes = await getCurrentUserAction();
      if (!userRes.success || !userRes.user) {
        // Not authenticated -> redirect to login
        router.push("/login?redirect=/profile");
        return;
      }

      setUser(userRes.user);
      setName(userRes.user.name || "");
      setPhone(cleanPhoneNumber(userRes.user.phone || ""));
      setAddress(userRes.user.address || "");

      // Load orders
      const ordersRes = await getCustomerOrdersAction();
      if (ordersRes.success && ordersRes.orders) {
        setOrders(ordersRes.orders);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = cleanPhoneNumber(e.target.value);
    setPhone(cleanDigits);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!name.trim()) {
      setProfileErrorMsg("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    if (phone && !isValidThaiPhone(phone)) {
      setProfileErrorMsg("กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง (เฉพาะตัวเลข 9-10 หลัก เช่น 0812345678)");
      return;
    }

    setProfileSaving(true);

    try {
      const res = await updateCustomerProfileAction({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });

      if (!res.success) {
        setProfileErrorMsg(res.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      } else {
        setProfileSuccessMsg("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
        setUser(res.user);
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg("กรุณาระบุรหัสผ่านปัจจุบัน");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordErrorMsg("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordErrorMsg("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await changeCustomerPasswordAction({
        currentPassword,
        newPassword,
      });

      if (!res.success) {
        setPasswordErrorMsg(res.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      } else {
        setPasswordSuccessMsg("เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setPasswordErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutCustomerAction();
    router.push("/");
    router.refresh();
  };

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTracking(trackingNum);
    setTimeout(() => setCopiedTracking(null), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">กำลังโหลดข้อมูลบัญชีผู้ใช้งาน...</p>
      </div>
    );
  }

  if (!user) return null;

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter === "PENDING") {
      return (
        order.status === "PENDING_PAYMENT" ||
        order.status === "PENDING_VERIFICATION" ||
        order.status === "PREPARING"
      );
    }
    if (orderFilter === "COMPLETED") {
      return (
        order.status === "PAID" ||
        order.status === "READY_FOR_PICKUP" ||
        order.status === "SHIPPED"
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0f1728] via-[#141d33] to-[#0f1728] border border-gold-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 p-0.5 shadow-gold-glow flex-shrink-0">
              <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center text-gold-400 font-bold text-2xl uppercase">
                {user.name ? user.name.charAt(0) : "U"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {user.name}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 font-mono">
                  MEMBER
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.email}</span>
                {user.phone && (
                  <>
                    <span className="text-slate-600">•</span>
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatPhoneNumber(user.phone)}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/60 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 border-t border-slate-800/80 pt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-gold-500 text-slate-950 shadow-gold-glow"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>ข้อมูลส่วนตัวและที่อยู่จัดส่ง</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${
              activeTab === "orders"
                ? "bg-gold-500 text-slate-950 shadow-gold-glow"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>ประวัติการสั่งซื้อและติดตามสถานะ</span>
            {orders.length > 0 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === "orders"
                    ? "bg-slate-950 text-gold-400"
                    : "bg-gold-500/20 text-gold-300 border border-gold-500/40"
                }`}
              >
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Profile & Default Address */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Personal info & Default Shipping Address */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0f1728] border border-slate-800 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-gold-400" />
                  <span>ข้อมูลผู้ใช้งาน & ที่อยู่จัดส่งเริ่มต้น</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  ข้อมูลนี้จะถูกนำไปกรอกอัตโนมัติเมื่อท่านดำเนินการสั่งซื้อสินค้า
                </p>
              </div>

              {profileSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                      <span>เบอร์โทรศัพท์ (ตัวเลขเท่านั้น) *</span>
                      <span className="text-[10px] text-gold-400 font-mono">{phone.length}/10</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      placeholder="เช่น 0812345678"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      อีเมล (ใช้เป็นชื่อผู้ใช้)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Default Shipping Address */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold-400" />
                    <span>ที่อยู่จัดส่งพัสดุเริ่มต้น (Default Shipping Address)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    * เมื่อสั่งซื้อ ระบบจะนำที่อยู่นี้ไปใส่ในช่องจัดส่งพัสดุให้อัตโนมัติ
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-gold-glow transition-all disabled:opacity-50"
                >
                  {profileSaving ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>บันทึกการเปลี่ยนแปลง</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Change Password */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0f1728] border border-slate-800 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gold-400" />
                  <span>เปลี่ยนรหัสผ่าน</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  ตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชี
                </p>
              </div>

              {passwordSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {passwordErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    รหัสผ่านปัจจุบัน *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 pl-4 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold-300 p-1"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    รหัสผ่านใหม่ (อย่างน้อย 6 ตัว) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 pl-4 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold-300 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    ยืนยันรหัสผ่านใหม่ *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-400 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {passwordSaving ? (
                    <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>อัปเดตรหัสผ่านใหม่</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Order History & Tracking */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f1728] border border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gold-400" />
              <h2 className="text-base font-bold text-white">รายการคำสั่งซื้อของฉัน</h2>
              <span className="text-xs text-slate-400">({filteredOrders.length} รายการ)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#131b2e] p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setOrderFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  orderFilter === "ALL"
                    ? "bg-gold-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ทั้งหมด ({orders.length})
              </button>
              <button
                onClick={() => setOrderFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  orderFilter === "PENDING"
                    ? "bg-gold-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                รอชำระ/รอตรวจ
              </button>
              <button
                onClick={() => setOrderFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  orderFilter === "COMPLETED"
                    ? "bg-gold-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                จัดส่งแล้ว/สำเร็จ
              </button>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#0f1728] border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">ยังไม่พบรายการคำสั่งซื้อ</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {orderFilter === "ALL"
                  ? "ท่านยังไม่มีประวัติการสั่งซื้อ เลือกชมการ์ดเกมและอุปกรณ์เสริมของแท้ได้เลย"
                  : "ไม่พบคำสั่งซื้อในหมวดหมู่นี้"}
              </p>
              <Link
                href="/products"
                className="inline-block px-6 py-2.5 rounded-xl bg-gold-500 text-slate-950 text-xs font-bold hover:bg-gold-400 shadow-gold-glow transition-all"
              >
                เลือกดูสินค้าทั้งหมด
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const badge = getOrderStatusBadgeStyle(order.status);
                const isPending =
                  order.status === "PENDING_PAYMENT" || order.status === "PENDING_VERIFICATION";

                return (
                  <div
                    key={order.id}
                    className="p-5 sm:p-6 rounded-3xl bg-[#0f1728] border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-extrabold text-gold-300 font-mono tracking-wide">
                            #{order.orderNumber}
                          </span>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>สั่งซื้อเมื่อ {formatDateThai(order.createdAt)}</span>
                        </p>
                      </div>

                      {/* Right: Fulfillment Info & Tracking */}
                      <div className="flex items-center gap-2 sm:text-right">
                        {order.fulfillmentType === "STORE_PICKUP" ? (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5" />
                            <span>รับที่ร้าน</span>
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            <span>จัดส่งพัสดุ</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tracking Number Section (If Available) */}
                    {order.trackingNumber && (
                      <div className="p-3 rounded-2xl bg-[#131d33] border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-blue-300">
                          <Truck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span>
                            หมายเลขพัสดุ:{" "}
                            <strong className="font-mono text-white text-sm">
                              {order.trackingNumber}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyTracking(order.trackingNumber)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>
                              {copiedTracking === order.trackingNumber ? "คัดลอกแล้ว!" : "คัดลอก"}
                            </span>
                          </button>
                          <a
                            href={`https://track.thailandpost.co.th/?trackNumber=${order.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <span>เช็คสถานะพัสดุ</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-2.5 pt-1">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#131b2e] border border-slate-800/80"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                              <Image
                                src={
                                  item.variant?.product?.images?.[0] ||
                                  "/logos/sp-logo.png"
                                }
                                alt={item.variant?.product?.name || "สินค้า"}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 line-clamp-1">
                                {item.variant?.product?.name}
                              </p>
                              <p className="text-[11px] text-gold-400 mt-0.5">
                                {item.variant?.name} x {item.quantity}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-slate-100">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              @{formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Bottom Bar: Total & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                      <div className="text-xs text-slate-400">
                        ยอดรวมทั้งสิ้น (รวมค่าจัดส่ง):{" "}
                        <strong className="text-base font-bold text-gold-300">
                          {formatCurrency(order.totalAmount)}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isPending && (
                          <Link
                            href={`/orders/${order.orderNumber}`}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>ชำระเงิน / แนบสลิป</span>
                          </Link>
                        )}
                        <Link
                          href={`/orders/${order.orderNumber}`}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <span>ดูรายละเอียด</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
