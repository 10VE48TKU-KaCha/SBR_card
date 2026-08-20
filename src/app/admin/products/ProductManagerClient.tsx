"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CardLanguage, GameFranchise, VariantType } from "@prisma/client";
import {
  formatCurrency,
  formatDateShort,
  getFranchiseBadgeStyle,
  getFranchiseLabel,
  getRarityBadgeStyle,
  getLanguageLabel,
} from "@/lib/utils";
import { saveProductAction, deleteProductAction } from "@/lib/actions";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Upload,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  ShieldCheck,
  Award,
} from "lucide-react";

interface VariantFormItem {
  id?: string;
  type: VariantType;
  name: string;
  sku: string;
  price: number | string;
  multiplier: number;
}

interface ProductItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  franchise: GameFranchise;
  images: string[];
  isPreOrder: boolean;
  releaseDate: string | null;
  baseUnitName: string;
  baseStock: number;
  packsPerBox: number;
  boxesPerCarton: number;
  isActive: boolean;
  isSingleCard?: boolean;
  cardNumber?: string | null;
  rarity?: string | null;
  cardLanguage?: CardLanguage | null;
  clanNation?: string | null;
  cardType?: string | null;
  foilType?: string | null;
  variants: VariantFormItem[];
}

export function ProductManagerClient({
  initialProducts,
}: {
  initialProducts: ProductItem[];
}) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [tableFilter, setTableFilter] = useState<"all" | "sealed" | "single">("all");

  // Form states
  const [isSingleCard, setIsSingleCard] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [franchise, setFranchise] = useState<GameFranchise>(GameFranchise.VANGUARD);
  const [images, setImages] = useState<string[]>([]);
  const [isPreOrder, setIsPreOrder] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  
  // Single card specific form states
  const [cardNumber, setCardNumber] = useState("");
  const [rarity, setRarity] = useState("RRR");
  const [cardLanguage, setCardLanguage] = useState<CardLanguage>(CardLanguage.TH);
  const [clanNation, setClanNation] = useState("");
  const [cardType, setCardType] = useState("");
  const [foilType, setFoilType] = useState("");
  const [singleCardPrice, setSingleCardPrice] = useState<number | string>(150);

  // Sealed specific form states
  const [allowSinglePack, setAllowSinglePack] = useState(true);
  const [baseUnitName, setBaseUnitName] = useState("ซอง");
  const [selectedUnitOption, setSelectedUnitOption] = useState<string>("ซอง");
  const [customBaseUnitName, setCustomBaseUnitName] = useState<string>("");
  const [packsPerBox, setPacksPerBox] = useState<number>(16);
  const [boxesPerCarton, setBoxesPerCarton] = useState<number>(16);
  const [baseStock, setBaseStock] = useState<number>(0);

  // Variants for sealed
  const [variants, setVariants] = useState<VariantFormItem[]>([
    {
      type: VariantType.SINGLE_PACK,
      name: "แบบซอง (Single Pack)",
      sku: "",
      price: "",
      multiplier: 1,
    },
    {
      type: VariantType.BOOSTER_BOX,
      name: "แบบกล่อง (Booster Box)",
      sku: "",
      price: "",
      multiplier: 16,
    },
    {
      type: VariantType.CARTON_CASE,
      name: "แบบลัง (Carton Case)",
      sku: "",
      price: "",
      multiplier: 256,
    },
  ]);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRarityPresets = (franchise: GameFranchise) => {
    switch (franchise) {
      case GameFranchise.VANGUARD:
        return ["DSR", "FFR", "SEC", "SP", "RRR", "RR", "R", "C", "PR"];
      case GameFranchise.YUGIOH:
        return ["QCS", "Starlight", "Secret", "Ultra Rare", "Super Rare", "Rare", "Common", "Promo"];
      case GameFranchise.BUDDYFIGHT:
        return ["Buddy Rare", "Ultimate Rare", "Secret", "Super Rare", "RRR", "RR", "R"];
      case GameFranchise.BATTLE_SPIRITS:
        return ["XX-Rare", "X-Rare", "M-Rare", "Rare", "Common"];
      default:
        return ["Secret", "SR", "RRR", "RR", "R", "Common", "Promo"];
    }
  };

  const openCreateModal = (forceSingleCard: boolean = false) => {
    setEditingProduct(null);
    setIsSingleCard(forceSingleCard);
    setCode("");
    setName("");
    setDescription("");
    setFranchise(GameFranchise.VANGUARD);
    setImages([]);
    setIsPreOrder(false);
    setReleaseDate("");
    
    // Single card defaults
    setCardNumber("");
    setRarity("RRR");
    setCardLanguage(CardLanguage.TH);
    setClanNation("");
    setCardType("");
    setFoilType("");
    setSingleCardPrice(150);

    // Sealed defaults
    setAllowSinglePack(true);
    setBaseUnitName("ซอง");
    setSelectedUnitOption("ซอง");
    setCustomBaseUnitName("");
    setPacksPerBox(16);
    setBoxesPerCarton(16);
    setBaseStock(forceSingleCard ? 4 : 100);
    setVariants([
      {
        type: VariantType.SINGLE_PACK,
        name: "แบบซอง (Single Pack)",
        sku: "",
        price: "",
        multiplier: 1,
      },
      {
        type: VariantType.BOOSTER_BOX,
        name: "แบบกล่อง (Booster Box)",
        sku: "",
        price: "",
        multiplier: 16,
      },
      {
        type: VariantType.CARTON_CASE,
        name: "แบบลัง (Carton Case)",
        sku: "",
        price: "",
        multiplier: 256,
      },
    ]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setIsSingleCard(Boolean(product.isSingleCard));
    setCode(product.code);
    setName(product.name);
    setDescription(product.description || "");
    setFranchise(product.franchise);
    setImages(product.images || []);
    setIsPreOrder(product.isPreOrder);
    setReleaseDate(product.releaseDate ? product.releaseDate.split("T")[0] : "");

    // Single card fields
    setCardNumber(product.cardNumber || "");
    setRarity(product.rarity || "RRR");
    setCardLanguage(product.cardLanguage || CardLanguage.TH);
    setClanNation(product.clanNation || "");
    setCardType(product.cardType || "");
    setFoilType(product.foilType || "");
    const singleVar = product.variants?.find((v) => v.type === VariantType.SINGLE_CARD) || product.variants?.[0];
    setSingleCardPrice(singleVar ? Number(singleVar.price) : 150);

    const hasSinglePack = (product.variants || []).some(
      (v) => v.type === VariantType.SINGLE_PACK
    );
    setAllowSinglePack(hasSinglePack);
    
    const unit = product.baseUnitName || (product.isSingleCard ? "ใบ" : "ซอง");
    if (["ซอง", "กล่อง", "ชิ้น", "ใบ"].includes(unit)) {
      setSelectedUnitOption(unit);
      setCustomBaseUnitName("");
    } else {
      setSelectedUnitOption("custom");
      setCustomBaseUnitName(unit);
    }
    setBaseUnitName(unit);
    setPacksPerBox(product.packsPerBox || 1);
    setBoxesPerCarton(product.boxesPerCarton || 1);
    setBaseStock(product.baseStock);
    
    // Ensure variants exist in form state
    let formVariants = product.variants || [];
    if (!product.isSingleCard && !hasSinglePack) {
      formVariants = [
        {
          type: VariantType.SINGLE_PACK,
          name: "แบบซอง (Single Pack)",
          sku: "",
          price: 70,
          multiplier: 1,
        },
        ...formVariants,
      ];
    }
    setVariants(formVariants);
    setError(null);
    setIsModalOpen(true);
  };

  // Image Upload with Automatic Sharp Watermarking
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "product"); // Request sharp watermark

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "อัปโหลดภาพไม่สำเร็จ");
      }

      setImages((prev) => [...prev, data.dataUri || data.url]);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการอัปโหลดภาพ");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("กรุณากรอกรหัสสินค้าและชื่อสินค้า");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let processedVariants: any[] = [];

      if (isSingleCard) {
        // Single card variant
        const priceNum = Number(singleCardPrice) || 0;
        processedVariants = [
          {
            type: VariantType.SINGLE_CARD,
            name: `${name.trim()} [${rarity || "Single"}]`,
            sku: `${code.trim().toUpperCase()}-CARD`,
            price: priceNum,
            multiplier: 1,
          },
        ];
      } else {
        // Sealed variants
        processedVariants = variants
          .filter((v) => allowSinglePack || v.type !== VariantType.SINGLE_PACK)
          .map((v, i) => ({
            ...v,
            price: Number(v.price) || 0,
            sku: v.sku.trim() || `${code.trim().toUpperCase()}-V${i + 1}`,
          }));
      }

      const res = await saveProductAction({
        id: editingProduct?.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        franchise,
        images,
        isPreOrder,
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : null,
        baseUnitName: isSingleCard ? "ใบ" : (allowSinglePack ? baseUnitName : (baseUnitName === "ซอง" ? "กล่อง" : baseUnitName)),
        packsPerBox: isSingleCard ? 1 : (allowSinglePack ? Number(packsPerBox) : 1),
        boxesPerCarton: isSingleCard ? 1 : Number(boxesPerCarton),
        baseStock: Number(baseStock),
        isSingleCard,
        cardNumber: isSingleCard ? (cardNumber.trim() || null) : null,
        rarity: isSingleCard ? (rarity.trim() || null) : null,
        cardLanguage: isSingleCard ? cardLanguage : CardLanguage.TH,
        clanNation: isSingleCard ? (clanNation.trim() || null) : null,
        cardType: isSingleCard ? (cardType.trim() || null) : null,
        foilType: isSingleCard ? (foilType.trim() || null) : null,
        variants: processedVariants,
      });

      if (!res.success) {
        throw new Error(res.error || "ไม่สามารถบันทึกสินค้าได้");
      }

      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) return;
    try {
      await deleteProductAction(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("ลบสินค้าไม่สำเร็จ");
    }
  };

  const filteredProducts = products.filter((p) => {
    if (tableFilter === "single") return Boolean(p.isSingleCard);
    if (tableFilter === "sealed") return !p.isSingleCard;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-gold-400" />
            <span>จัดการสินค้า & การ์ดแยกใบ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ลงสินค้ากล่อง/ซอง และการ์ดแยกใบ (Single Cards) พร้อมระบบลายน้ำอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => openCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-gold-glow transition-all"
          >
            <span>🃏</span>
            <span>เพิ่มการ์ดแยกใบ (Single Card)</span>
          </button>

          <button
            onClick={() => openCreateModal(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gold-300 border border-gold-500/40 font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสินค้ากล่อง/ซอง</span>
          </button>
        </div>
      </div>

      {/* Category Tab Filter */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0e1628] rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setTableFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tableFilter === "all"
              ? "bg-gold-500 text-slate-950 shadow-gold-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          ทั้งหมด ({products.length})
        </button>
        <button
          onClick={() => setTableFilter("single")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            tableFilter === "single"
              ? "bg-amber-500 text-slate-950 shadow-gold-glow"
              : "text-amber-300 hover:text-amber-200"
          }`}
        >
          <span>🃏</span>
          <span>การ์ดแยกใบ ({products.filter((p) => p.isSingleCard).length})</span>
        </button>
        <button
          onClick={() => setTableFilter("sealed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tableFilter === "sealed"
              ? "bg-gold-500 text-slate-950 shadow-gold-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          กล่อง & ซอง ({products.filter((p) => !p.isSingleCard).length})
        </button>
      </div>

      {/* Product Table */}
      <div className="p-6 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">รูปภาพ & รหัส</th>
                <th className="pb-3 font-semibold">ชื่อสินค้า / การ์ด</th>
                <th className="pb-3 font-semibold">แฟรนไชส์ / ประเภท</th>
                <th className="pb-3 font-semibold">รายละเอียด / อัตราส่วน</th>
                <th className="pb-3 font-semibold">สต็อกคงเหลือ</th>
                <th className="pb-3 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredProducts.map((p) => {
                const badge = getFranchiseBadgeStyle(p.franchise);
                const isSingle = Boolean(p.isSingleCard);
                const rarityBadge = isSingle && p.rarity ? getRarityBadgeStyle(p.rarity) : null;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                          <Image
                            src={p.images[0] || "/logos/sp-logo.png"}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-200 block">{p.code}</span>
                          {isSingle && p.cardNumber && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {p.cardNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 max-w-xs">
                      <div className="font-semibold text-slate-100 line-clamp-1">{p.name}</div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {isSingle ? (
                          <>
                            {p.rarity && rarityBadge && (
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase border ${rarityBadge.bg} ${rarityBadge.text} ${rarityBadge.border}`}
                              >
                                {p.rarity}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              {getLanguageLabel(p.cardLanguage)}
                            </span>
                            {p.clanNation && (
                              <span className="text-[10px] text-slate-400">
                                ({p.clanNation})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {p.isPreOrder && (
                              <span className="text-[10px] text-rose-400 font-bold">
                                [Pre-Order {p.releaseDate ? formatDateShort(p.releaseDate) : ""}]
                              </span>
                            )}
                            {!p.variants.some((v) => v.type === VariantType.SINGLE_PACK) && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                                🚫 ปิดขายแบบซอง
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {getFranchiseLabel(p.franchise)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isSingle ? "🃏 การ์ดแยกใบ" : "📦 สินค้ากล่อง/ซอง"}
                      </span>
                    </td>

                    <td className="py-3.5 font-mono text-slate-300">
                      {isSingle ? (
                        <div>
                          <div className="text-gold-300 font-bold">
                            {formatCurrency(p.variants?.[0]?.price || 0)} / ใบ
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {p.cardType || "การ์ดเดี่ยว"} • {p.foilType || "แท้ 100%"}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>X = {p.packsPerBox} ซอง/กล่อง</div>
                          <div className="text-[10px] text-slate-400">Y = {p.boxesPerCarton} กล่อง/ลัง</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 font-mono">
                      <span className="text-sm font-bold text-gold-300">{p.baseStock}</span>{" "}
                      <span className="text-[11px] text-slate-400">
                        {isSingle ? "ใบ" : p.baseUnitName}
                      </span>
                    </td>

                    <td className="py-3.5 text-right space-x-2 whitespace-nowrap">
                      {/* View Storefront Link */}
                      <Link
                        href={`/products/${p.code}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gold-300 text-xs font-medium"
                        title="ดูหน้าร้าน (Preview Page)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูหน้าร้าน</span>
                      </Link>

                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="แก้ไขสินค้า"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400"
                        title="ลบสินค้า"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-4xl bg-[#0e1628] border border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-gold-400" />
                  <span>{editingProduct ? "แก้ไขข้อมูลสินค้า" : isSingleCard ? "เพิ่มการ์ดแยกใบ (Single Card)" : "สร้างสินค้ากล่อง/ซองใหม่"}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {isSingleCard
                    ? "กรอกข้อมูลรหัสการ์ด, ระดับความหายาก (Rarity) และราคาต่อใบ"
                    : "กำหนดอัตราส่วนซองต่อกล่องและกล่องต่อลัง"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Type Switcher (If creating new) */}
            {!editingProduct && (
              <div className="flex items-center gap-3 p-1.5 bg-[#131b2e] rounded-2xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsSingleCard(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    !isSingleCard
                      ? "bg-gold-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>📦 สินค้ากล่อง & ซอง (Sealed Product)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSingleCard(true)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isSingleCard
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>🃏</span>
                  <span>การ์ดแยกใบ (Single Card)</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Franchise & Basic Codes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    แฟรนไชส์เกม (Franchise) *
                  </label>
                  <select
                    value={franchise}
                    onChange={(e) => setFranchise(e.target.value as GameFranchise)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                  >
                    {Object.values(GameFranchise).map((f) => (
                      <option key={f} value={f}>
                        {getFranchiseLabel(f)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    รหัสระบบ (System Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isSingleCard ? "เช่น VG-DZ-BT02-001" : "เช่น VG-DZ-BT02"}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 uppercase font-mono"
                  />
                </div>

                {isSingleCard ? (
                  <div>
                    <label className="text-xs font-semibold text-gold-300 block mb-1">
                      รหัสการ์ด (Card Number) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น DZ-BT02/001TH หรือ RC04-JP001"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-[#131b2e] border border-gold-500/50 rounded-xl py-2 px-3 text-xs text-slate-100 uppercase font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      หน่วยนับหลัก (Base Unit)
                    </label>
                    <select
                      value={selectedUnitOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedUnitOption(val);
                        if (val !== "custom") setBaseUnitName(val);
                        else setBaseUnitName(customBaseUnitName || "");
                      }}
                      className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                    >
                      <option value="ซอง">ซอง</option>
                      <option value="กล่อง">กล่อง</option>
                      <option value="ชิ้น">ชิ้น</option>
                      <option value="custom">อื่นๆ (ระบุเอง...)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {isSingleCard ? "ชื่อการ์ด (Card Name) *" : "ชื่อสินค้า (Product Name) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isSingleCard
                      ? "เช่น ลิอาเนิร์น วิวาเช่ (Lianorn Vivace)"
                      : "เช่น Cardfight!! Vanguard DZ-BT02: Illusions of the Crescent Moon"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                />
              </div>

              {/* Single Card Specific Attributes Box */}
              {isSingleCard && (
                <div className="p-5 rounded-2xl bg-[#131b2e] border border-gold-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gold-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🃏</span>
                      <span>คุณสมบัติการ์ดแยกใบ (Single Card Specs)</span>
                    </label>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      ✨ รับประกันการ์ดแท้สภาพใหม่แกะซอง 100%
                    </span>
                  </div>

                  {/* Rarity & Presets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-semibold">
                        ระดับความหายาก (Rarity) *
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">เลือกด่วน:</span>
                        {getRarityPresets(franchise).map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => setRarity(preset)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all border ${
                              rarity.toUpperCase() === preset.toUpperCase()
                                ? "bg-amber-500 text-slate-950 border-amber-400"
                                : "bg-slate-800 text-slate-300 border-slate-700 hover:text-gold-300"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="เช่น DSR, FFR, SP, SEC, RRR, RR, R, QCS"
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs font-mono font-bold text-gold-300"
                    />
                  </div>

                  {/* Language, Clan, Card Type & Foil */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        ภาษาการ์ด (Language)
                      </label>
                      <select
                        value={cardLanguage}
                        onChange={(e) => setCardLanguage(e.target.value as CardLanguage)}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                      >
                        <option value={CardLanguage.TH}>ภาษาไทย (TH)</option>
                        <option value={CardLanguage.JP}>ภาษาญี่ปุ่น (JP)</option>
                        <option value={CardLanguage.EN}>ภาษาอังกฤษ (EN)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        แคลน / เนชั่น (Clan/Nation)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น Stoicheia, Dragon Empire"
                        value={clanNation}
                        onChange={(e) => setClanNation(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        ประเภทการ์ด (Card Type)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น Normal Unit, Trigger, Spell"
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        ชนิดฟอยล์ (Foil Finish)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น Secret Rare, Holo, Non-Foil"
                        value={foilType}
                        onChange={(e) => setFoilType(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Price & Stock for Single Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-xs font-bold text-gold-300 block mb-1">
                        ราคาจำหน่ายต่อใบ (บาท) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        placeholder="เช่น 250"
                        value={singleCardPrice}
                        onChange={(e) => setSingleCardPrice(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-700 focus:border-gold-400 rounded-xl py-2.5 px-3 text-sm font-bold font-mono text-gold-300"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gold-300 block mb-1">
                        จำนวนสต็อกคงเหลือ (ใบ) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="เช่น 4"
                        value={baseStock}
                        onChange={(e) => setBaseStock(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0b0f19] border border-slate-700 focus:border-gold-400 rounded-xl py-2.5 px-3 text-sm font-bold font-mono text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sealed Packaging Ratios (X & Y) & Stock Base */}
              {!isSingleCard && (
                <div className="p-4 rounded-2xl bg-[#131b2e] border border-slate-800 space-y-4">
                  <label className="text-xs font-bold text-gold-300 uppercase tracking-wider block">
                    ⚙️ กำหนดอัตราส่วนบรรจุภัณฑ์ (Packaging Ratios) & สต็อกเริ่มต้น
                  </label>

                  <div className={`grid grid-cols-1 ${allowSinglePack ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
                    {allowSinglePack && (
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          X: ซองต่อกล่อง (Packs/Box)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={packsPerBox}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setPacksPerBox(val);
                            setVariants((prev) =>
                              prev.map((v) => {
                                if (v.type === VariantType.BOOSTER_BOX) return { ...v, multiplier: val };
                                if (v.type === VariantType.CARTON_CASE) return { ...v, multiplier: val * boxesPerCarton };
                                return v;
                              })
                            );
                          }}
                          className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Y: กล่องต่อลัง (Boxes/Carton)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={boxesPerCarton}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setBoxesPerCarton(val);
                          setVariants((prev) =>
                            prev.map((v) => {
                              if (v.type === VariantType.CARTON_CASE)
                                return { ...v, multiplier: (allowSinglePack ? packsPerBox : 1) * val };
                              return v;
                            })
                          );
                        }}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        สต็อกเริ่มต้น (Base Units)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={baseStock}
                        onChange={(e) => setBaseStock(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  รายละเอียดสินค้า / เอฟเฟกต์การ์ด
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                />
              </div>

              {/* Pre-Order Toggle & Release Date (Sealed) */}
              {!isSingleCard && (
                <div className="p-4 rounded-2xl bg-[#131b2e] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPreOrder}
                      onChange={(e) => setIsPreOrder(e.target.checked)}
                      className="rounded border-slate-700 text-gold-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      🔥 สินค้าสั่งจองล่วงหน้า (Pre-Order)
                    </span>
                  </label>

                  {isPreOrder && (
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        กำหนดวันวางจำหน่ายอย่างเป็นทางการ
                      </label>
                      <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-slate-100"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Automated Sharp Watermark Image Uploader */}
              <div className="p-4 rounded-2xl bg-[#131b2e] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gold-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>รูปภาพสินค้า (ระบบประทับลายน้ำอัตโนมัติ Sharp 40% Opacity)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    ประทับโลโก้ร้านมุมขวาล่างทันที
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group"
                    >
                      <Image src={img} alt="" fill unoptimized className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="w-20 h-24 rounded-xl border-2 border-dashed border-slate-700 hover:border-gold-400 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-gold-300 transition-colors">
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-[9px] mt-1">เพิ่มภาพ</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </p>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-gold-glow flex items-center gap-1.5 disabled:opacity-40"
                >
                  {loading ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>บันทึกสินค้า</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
