import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Truck, Store, Clock, Phone, MapPin, QrCode } from "lucide-react";
import { getShopSettingsAction } from "@/lib/actions";

export async function Footer() {
  const settings = await getShopSettingsAction();

  return (
    <footer className="border-t border-slate-800 bg-[#070a12] text-slate-400 text-sm mt-20">
      {/* Service Highlights */}
      <div className="border-b border-slate-800/80 bg-[#0c121e]/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">การ์ดแท้ 100%</h4>
              <p className="text-xs text-slate-400">ลิขสิทธิ์ถูกต้อง Bushiroad & Konami</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">รับที่ร้านสุภาพบุรุษ</h4>
              <p className="text-xs text-slate-400">พร้อมรับของทันที ไม่มีค่าส่ง</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">PromptPay QR ตรงยอด</h4>
              <p className="text-xs text-slate-400">ระบบสร้าง QR ปลอดภัย ล็อคยอดอัตโนมัติ</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">จัดส่งพัสดุห่อหนาแน่น</h4>
              <p className="text-xs text-slate-400">ห่อบับเบิ้ลกันกระแทกทุกออเดอร์</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gold-400/80">
                <Image
                  src="/logos/sp-logo.png"
                  alt="ร้านสุภาพบุรุษ"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-bold gold-gradient-text">
                ร้านสุภาพบุรุษ
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              ร้านสุภาพบุรุษ ศูนย์รวมการ์ดเกมคุณภาพสูงและสร้างคอมมูนิตี้สำหรับผู้เล่นทุกระดับ ยึดมั่นในความซื่อสัตย์และความจริงใจ
            </p>
          </div>

          {/* Quick Categories */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-4 text-sm">หมวดหมู่การ์ดเกม</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/products?franchise=VANGUARD" className="hover:text-gold-400 transition-colors">
                  Cardfight!! Vanguard
                </Link>
              </li>
              <li>
                <Link href="/products?franchise=BUDDYFIGHT" className="hover:text-gold-400 transition-colors">
                  Future Card Buddyfight
                </Link>
              </li>
              <li>
                <Link href="/products?franchise=YUGIOH" className="hover:text-gold-400 transition-colors">
                  Yu-Gi-Oh! Official Card Game
                </Link>
              </li>
              <li>
                <Link href="/products?franchise=BATTLE_SPIRITS" className="hover:text-gold-400 transition-colors">
                  Battle Spirits
                </Link>
              </li>
              <li>
                <Link href="/products?franchise=OTHER" className="hover:text-gold-400 transition-colors">
                  ซองใส่การ์ด & กล่องเด็คสุภาพบุรุษ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-4 text-sm">บริการลูกค้า</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/track" className="hover:text-gold-400 transition-colors">
                  ติดตามสถานะคำสั่งซื้อ
                </Link>
              </li>
              <li>
                <Link href="/products?preOrder=true" className="hover:text-gold-400 transition-colors">
                  สินค้าพรีออเดอร์ (Pre-Order)
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-gold-400 transition-colors">
                  ตะกร้าสินค้าของฉัน
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Location & Contact (Dynamic from Database) */}
          <div className="space-y-3 text-xs">
            <h3 className="text-slate-200 font-semibold mb-4 text-sm">ติดต่อหน้าร้าน</h3>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
              <span className="whitespace-pre-line leading-relaxed">{settings.address}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
              <span>{settings.phone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-gold-400 flex-shrink-0" />
              <span>{settings.businessHours}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 mt-10 pt-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ร้านสุภาพบุรุษ</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>การันตีสินค้าลิขสิทธิ์แท้</span>
            <span>•</span>
            <span>PromptPay EMVCo Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
