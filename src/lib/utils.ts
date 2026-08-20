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

/**
 * Cleans phone input to contain only digits (0-9) and limits max length to 10.
 */
export function cleanPhoneNumber(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(0, 10);
}

/**
 * Validates whether the phone number is a standard Thai mobile or landline format (9-10 digits starting with 0).
 */
export function isValidThaiPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const digits = cleanPhoneNumber(value);
  return /^0[0-9]{8,9}$/.test(digits);
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "-";
  const clean = cleanPhoneNumber(phone);
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  if (clean.length === 9) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
  }
  return clean || phone;
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
    case VariantType.SINGLE_CARD:
      return "การ์ดแยกใบ (Single Card)";
    default:
      return "สินค้า";
  }
}

export function getLanguageLabel(lang?: string | null): string {
  switch (lang) {
    case "TH":
      return "ภาษาไทย (TH)";
    case "JP":
      return "ภาษาญี่ปุ่น (JP)";
    case "EN":
      return "ภาษาอังกฤษ (EN)";
    default:
      return "ภาษาไทย (TH)";
  }
}

export function getRarityBadgeStyle(rarity?: string | null): {
  bg: string;
  text: string;
  border: string;
  glow?: string;
  isHighRarity: boolean;
} {
  if (!rarity) {
    return {
      bg: "bg-slate-800",
      text: "text-slate-300",
      border: "border-slate-700",
      isHighRarity: false,
    };
  }

  const r = rarity.toUpperCase().trim();

  // Super High Rare / Signature / Master Rares (Gold / Rainbow shimmer)
  if (
    r === "DSR" ||
    r === "FFR" ||
    r === "SEC" ||
    r === "SECRET" ||
    r === "SECRET RARE" ||
    r === "QCS" ||
    r === "QUARTER CENTURY SECRET" ||
    r === "STARLIGHT" ||
    r === "STARLIGHT RARE" ||
    r === "BUDDY RARE" ||
    r === "ULTIMATE RARE" ||
    r === "XX-RARE" ||
    r === "XXR"
  ) {
    return {
      bg: "bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-600/20",
      text: "text-amber-300 font-extrabold",
      border: "border-amber-400/70",
      glow: "shadow-[0_0_12px_rgba(251,191,36,0.35)]",
      isHighRarity: true,
    };
  }

  // High Rares (SP, RRR, X-Rare, Ultra Rare)
  if (
    r === "SP" ||
    r === "RRR" ||
    r === "X-RARE" ||
    r === "XR" ||
    r === "ULTRA RARE" ||
    r === "UR" ||
    r === "SUPER RARE" ||
    r === "SR"
  ) {
    return {
      bg: "bg-gradient-to-r from-purple-900/40 to-indigo-900/40",
      text: "text-purple-300 font-bold",
      border: "border-purple-500/60",
      glow: "shadow-[0_0_8px_rgba(168,85,247,0.25)]",
      isHighRarity: true,
    };
  }

  // Medium Rares (RR, R, M-Rare)
  if (r === "RR" || r === "R" || r === "M-RARE" || r === "MR" || r === "RARE") {
    return {
      bg: "bg-blue-950/60",
      text: "text-blue-300 font-semibold",
      border: "border-blue-500/50",
      isHighRarity: false,
    };
  }

  // Promo / Special (PR, PROMO)
  if (r === "PR" || r === "PROMO") {
    return {
      bg: "bg-emerald-950/60",
      text: "text-emerald-300 font-bold",
      border: "border-emerald-500/50",
      glow: "shadow-[0_0_8px_rgba(16,185,129,0.25)]",
      isHighRarity: true,
    };
  }

  // Common / Standard
  return {
    bg: "bg-slate-800/80",
    text: "text-slate-300 font-medium",
    border: "border-slate-700",
    isHighRarity: false,
  };
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

export function getOrderStatusLabel(status: OrderStatus): string {
  return getOrderStatusInfo(status).label;
}

export function getOrderStatusBadgeStyle(status: OrderStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return { bg: "bg-amber-950/80", text: "text-amber-300", border: "border-amber-500/40" };
    case OrderStatus.PENDING_VERIFICATION:
      return { bg: "bg-blue-950/80", text: "text-blue-300", border: "border-blue-500/40" };
    case OrderStatus.PAID:
      return { bg: "bg-emerald-950/80", text: "text-emerald-300", border: "border-emerald-500/40" };
    case OrderStatus.PREPARING:
      return { bg: "bg-indigo-950/80", text: "text-indigo-300", border: "border-indigo-500/40" };
    case OrderStatus.READY_FOR_PICKUP:
      return { bg: "bg-purple-950/80", text: "text-purple-300", border: "border-purple-500/40" };
    case OrderStatus.SHIPPED:
      return { bg: "bg-cyan-950/80", text: "text-cyan-300", border: "border-cyan-500/40" };
    case OrderStatus.CANCELLED:
    default:
      return { bg: "bg-rose-950/80", text: "text-rose-300", border: "border-rose-500/40" };
  }
}
