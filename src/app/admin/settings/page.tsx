"use client";

import React, { useState, useEffect } from "react";
import { Building2, Phone, Clock, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { getShopSettingsAction, updateShopSettingsAction } from "@/lib/actions";

export default function AdminSettingsPage() {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getShopSettingsAction();
        setAddress(settings.address);
        setPhone(settings.phone);
        setBusinessHours(settings.businessHours);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await updateShopSettingsAction({
        address,
        phone,
        businessHours,
      });

      if (res.success) {
        setMessage({ type: "success", text: "บันทึกข้อมูลตั้งค่าร้านค้าเรียบร้อยแล้ว!" });
      } else {
        setMessage({ type: "error", text: res.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full mx-auto mb-3" />
        <span>กำลังโหลดข้อมูลตั้งค่าร้าน...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          ตั้งค่าข้อมูลร้าน & ช่องทางติดต่อ
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          จัดการที่อยู่ เบอร์โทรศัพท์ และเวลาเปิดบริการสำหรับแสดงผลตรงส่วน "ติดต่อหน้าร้าน" บนหน้าเว็บ
        </p>
      </div>

      {/* Message Feedback */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold-400" />
            <span>ที่อยู่หน้าร้าน (Store Address)</span>
          </label>
          <textarea
            rows={3}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="เช่น 123/45 ถนนเจริญกรุง แขวงวังบูรพาภิรมย์ เขตพระนคร กรุงเทพฯ 10200"
            className="w-full p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-gold-400 text-white text-xs placeholder:text-slate-500 outline-none transition-colors leading-relaxed"
          />
          <p className="text-[11px] text-slate-400">
            ที่อยู่นี้จะแสดงตรงหัวข้อ "ติดต่อหน้าร้าน" บริเวณด้านล่างของเว็บไซต์ (Footer)
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Phone className="w-4 h-4 text-gold-400" />
            <span>เบอร์โทรศัพท์ติดต่อ (Contact Phone)</span>
          </label>
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="เช่น 081-999-8888 (ฝ่ายบริการลูกค้า)"
            className="w-full p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-gold-400 text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-400" />
            <span>เวลาเปิด-ปิดให้บริการ (Business Operating Hours)</span>
          </label>
          <input
            type="text"
            required
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            placeholder="เช่น เปิดบริการทุกวัน 10:00 - 20:00 น."
            className="w-full p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-gold-400 text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-500 hover:from-gold-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-gold-glow flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
