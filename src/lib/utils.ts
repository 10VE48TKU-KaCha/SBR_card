import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { GameFranchise, OrderStatus, VariantType } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | { toNumber?: () => number } | null | undefined): string {
  if (amount === null || amount === undefined) return "฿0";
  let num = 0;
  if (typeof amount === "number") {
    num = amount;
  } else if (typeof amount === "string") {
    num = parseFloat(amount) || 0;
  } else if (typeof amount === "object" && typeof amount.toNumber === "function") {
    num = amount.toNumber();
  }
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num).replace("THB", "฿").trim();
}

export function formatPriceNumber(amount: number | string | { toNumber?: () => number } | null | undefined): number {
  if (amount === null || amount === undefined) return 0;
  if (typeof amount === "number") return amount;
  if (typeof amount === "string") return parseFloat(amount) || 0;
  if (typeof amount === "object" && typeof amount.toNumber === "function") return amount.toNumber();
  return 0;
}

export function formatDateThai(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatPhoneNumber(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export function getFranchiseLabel(franchise: GameFranchise): string {
  switch (franchise) {
    case GameFranchise.VANGUARD:
      return "Cardfight!! Vanguard";
    case GameFranchise.BUDDYFIGHT:
      return "Future Card Buddyfight";
    case GameFranchise.YUGIOH:
      return "Yu-Gi-Oh!";
    case GameFranchise.BATTLE_SPIRITS:
      return "Battle Spirits";
    case GameFranchise.OTHER:
    default:
      return "อุปกรณ์เสริม & การ์ดอื่นๆ";
  }
}

export function getFranchiseBadgeStyle(franchise: GameFranchise): { bg: string; text: string; border: string } {
  switch (franchise) {
    case GameFranchise.VANGUARD:
      return { bg: "bg-blue-950/80", text: "text-blue-300", border: "border-blue-700/60" };
    case GameFranchise.BUDDYFIGHT:
      return { bg: "bg-amber-950/80", text: "text-amber-300", border: "border-amber-700/60" };
    case GameFranchise.YUGIOH:
      return { bg: "bg-purple-950/80", text: "text-purple-300", border: "border-purple-700/60" };
    case GameFranchise.BATTLE_SPIRITS:
      return { bg: "bg-emerald-950/80", text: "text-emerald-300", border: "border-emerald-700/60" };
    case GameFranchise.OTHER:
    default:
      return { bg: "bg-slate-900/80", text: "text-slate-300", border: "border-slate-700/60" };
  }
}

export function getVariantTypeLabel(type: VariantType): string {
  switch (type) {
    case VariantType.SINGLE_PACK:
      return "แบบซอง (Single Pack)";
    case VariantType.BOOSTER_BOX:
      return "แบบกล่อง (Booster Box)";
    case VariantType.CARTON_CASE:
      return "แบบลัง (Carton Case)";
    case VariantType.STARTER_DECK:
      return "กล่องพร้อมเล่น (Starter Deck)";
    case VariantType.SPECIAL_SET:
      return "ชุดพิเศษ (Special Set)";
    default:
      return "สินค้า";
  }
}

export function getOrderStatusInfo(status: OrderStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
} {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return {
        label: "รอชำระเงิน",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        dotClass: "bg-amber-400",
        description: "กรุณาสแกน QR PromptPay เพื่อชำระเงินภายในเวลาที่กำหนด",
      };
    case OrderStatus.PENDING_VERIFICATION:
      return {
        label: "รอตรวจสอบสลิป",
        badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        dotClass: "bg-blue-400",
        description: "อัปโหลดสลิปเรียบร้อย เจ้าหน้าที่กำลังตรวจสอบการชำระเงิน",
      };
    case OrderStatus.PAID:
      return {
        label: "ชำระเงินแล้ว",
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        dotClass: "bg-emerald-400",
        description: "ยืนยันยอดเงินเรียบร้อย กำลังเตรียมจัดส่งสินค้า",
      };
    case OrderStatus.PREPARING:
      return {
        label: "กำลังจัดเตรียมสินค้า",
        badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
        dotClass: "bg-indigo-400",
        description: "เจ้าหน้าที่กำลังแพ็คการ์ดและบรรจุกล่องอย่างทะนุถนอม",
      };
    case OrderStatus.READY_FOR_PICKUP:
      return {
        label: "พร้อมรับที่ร้านสุภาพบุรุษ",
        badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        dotClass: "bg-purple-400",
        description: "สินค้าพร้อมแล้ว สามารถเข้ามารับที่หน้าร้านได้เลย",
      };
    case OrderStatus.SHIPPED:
      return {
        label: "จัดส่งแล้ว",
        badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
        dotClass: "bg-cyan-400",
        description: "พัสดุถูกส่งมอบให้บริษัทขนส่งเรียบร้อยแล้ว",
      };
    case OrderStatus.CANCELLED:
      return {
        label: "ยกเลิกแล้ว",
        badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        dotClass: "bg-rose-400",
        description: "คำสั่งซื้อถูกยกเลิก (เนื่องจากหมดเวลาชำระเงินหรือคำขอลูกค้า)",
      };
    default:
      return {
        label: "ไม่ทราบสถานะ",
        badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
        dotClass: "bg-slate-400",
        description: "",
      };
  }
}
