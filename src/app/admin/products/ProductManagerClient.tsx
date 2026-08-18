"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GameFranchise, VariantType } from "@prisma/client";
import {
  formatCurrency,
  formatDateShort,
  getFranchiseBadgeStyle,
  getFranchiseLabel,
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
} from "lucide-react";

interface VariantFormItem {
  id?: string;
  type: VariantType;
  name: string;
  sku: string;
  price: number;
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

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [franchise, setFranchise] = useState<GameFranchise>(GameFranchise.VANGUARD);
  const [images, setImages] = useState<string[]>([]);
  const [isPreOrder, setIsPreOrder] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [allowSinglePack, setAllowSinglePack] = useState(true);
  const [baseUnitName, setBaseUnitName] = useState("ซอง");
  const [packsPerBox, setPacksPerBox] = useState<number>(16);
  const [boxesPerCarton, setBoxesPerCarton] = useState<number>(16);
  const [baseStock, setBaseStock] = useState<number>(0);

  // Variants
  const [variants, setVariants] = useState<VariantFormItem[]>([
    {
      type: VariantType.SINGLE_PACK,
      name: "แบบซอง (Single Pack)",
      sku: "",
      price: 70,
      multiplier: 1,
    },
    {
      type: VariantType.BOOSTER_BOX,
      name: "แบบกล่อง (Booster Box)",
      sku: "",
      price: 1050,
      multiplier: 16,
    },
    {
      type: VariantType.CARTON_CASE,
      name: "แบบลัง (Carton Case)",
      sku: "",
      price: 16000,
      multiplier: 256,
    },
  ]);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingProduct(null);
    setCode("");
    setName("");
    setDescription("");
    setFranchise(GameFranchise.VANGUARD);
    setImages([]);
    setIsPreOrder(false);
    setReleaseDate("");
    setAllowSinglePack(true);
    setBaseUnitName("ซอง");
    setPacksPerBox(16);
    setBoxesPerCarton(16);
    setBaseStock(100);
    setVariants([
      {
        type: VariantType.SINGLE_PACK,
        name: "แบบซอง (Single Pack)",
        sku: "",
        price: 70,
        multiplier: 1,
      },
      {
        type: VariantType.BOOSTER_BOX,
        name: "แบบกล่อง (Booster Box)",
        sku: "",
        price: 1050,
        multiplier: 16,
      },
      {
        type: VariantType.CARTON_CASE,
        name: "แบบลัง (Carton Case)",
        sku: "",
        price: 16000,
        multiplier: 256,
      },
    ]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setCode(product.code);
    setName(product.name);
    setDescription(product.description || "");
    setFranchise(product.franchise);
    setImages(product.images || []);
    setIsPreOrder(product.isPreOrder);
    setReleaseDate(product.releaseDate ? product.releaseDate.split("T")[0] : "");
    const hasSinglePack = (product.variants || []).some(
      (v) => v.type === VariantType.SINGLE_PACK
    );
    setAllowSinglePack(hasSinglePack);
    setBaseUnitName(product.baseUnitName || "ซอง");
    setPacksPerBox(product.packsPerBox);
    setBoxesPerCarton(product.boxesPerCarton);
    setBaseStock(product.baseStock);
    
    // Ensure default single pack variant exists in form state even if currently omitted
    let formVariants = product.variants || [];
    if (!hasSinglePack) {
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

      setImages((prev) => [...prev, data.url]);
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
      // Auto-assign SKUs if blank and filter variants by allowSinglePack
      const processedVariants = variants
        .filter((v) => allowSinglePack || v.type !== VariantType.SINGLE_PACK)
        .map((v, i) => ({
          ...v,
          sku: v.sku.trim() || `${code.trim().toUpperCase()}-V${i + 1}`,
        }));

      const res = await saveProductAction({
        id: editingProduct?.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        franchise,
        images,
        isPreOrder,
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : null,
        baseUnitName,
        packsPerBox: Number(packsPerBox),
        boxesPerCarton: Number(boxesPerCarton),
        baseStock: Number(baseStock),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-gold-400" />
            <span>จัดการสินค้า & อัตราส่วนบรรจุภัณฑ์</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            กำหนดอัตราส่วน X (ซอง/กล่อง) และ Y (กล่อง/ลัง) พร้อมระบบลายน้ำอัตโนมัติ
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-gold-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสินค้าใหม่</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="p-6 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">รูปภาพ & รหัส</th>
                <th className="pb-3 font-semibold">ชื่อสินค้า</th>
                <th className="pb-3 font-semibold">แฟรนไชส์</th>
                <th className="pb-3 font-semibold">อัตราส่วน (X/Y)</th>
                <th className="pb-3 font-semibold">สต็อกรวม (Base Units)</th>
                <th className="pb-3 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {products.map((p) => {
                const badge = getFranchiseBadgeStyle(p.franchise);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                          <Image
                            src={p.images[0] || "/logos/sp-logo.png"}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">{p.code}</span>
                      </div>
                    </td>

                    <td className="py-3.5 max-w-xs">
                      <div className="font-semibold text-slate-100 line-clamp-1">{p.name}</div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
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
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {getFranchiseLabel(p.franchise)}
                      </span>
                    </td>

                    <td className="py-3.5 font-mono text-slate-300">
                      <div>X = {p.packsPerBox} ซอง/กล่อง</div>
                      <div className="text-[10px] text-slate-400">Y = {p.boxesPerCarton} กล่อง/ลัง</div>
                    </td>

                    <td className="py-3.5 font-mono">
                      <span className="text-sm font-bold text-gold-300">{p.baseStock}</span>{" "}
                      <span className="text-[11px] text-slate-400">{p.baseUnitName}</span>
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
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-gold-400" />
                <span>{editingProduct ? "แก้ไขสินค้า" : "สร้างสินค้าใหม่"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    รหัสสินค้า (Product Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น VG-DZ-BT04"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 uppercase font-mono"
                  />
                </div>

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
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ชื่อสินค้า (Product Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Cardfight!! Vanguard DZ-BT04: Absolute Judgment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  รายละเอียดสินค้า
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
                />
              </div>

              {/* Packaging Ratios (X & Y) & Stock Base */}
              <div className="p-4 rounded-2xl bg-[#131b2e] border border-slate-800 space-y-4">
                <label className="text-xs font-bold text-gold-300 uppercase tracking-wider block">
                  ⚙️ กำหนดอัตราส่วนบรรจุภัณฑ์ (Packaging Ratios) & สต็อกเริ่มต้น
                </label>

                <div className={`grid grid-cols-1 ${allowSinglePack ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-3`}>
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
                          // Auto update multiplier for box/carton
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
                      {allowSinglePack ? "Y: กล่องต่อลัง (Boxes/Carton)" : "กล่องต่อลัง (Boxes/Carton)"}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={boxesPerCarton}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setBoxesPerCarton(val);
                        // Auto update multiplier for carton
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
                      ชื่อหน่วยย่อย (Base Unit)
                    </label>
                    <input
                      type="text"
                      value={baseUnitName}
                      onChange={(e) => setBaseUnitName(e.target.value)}
                      placeholder={allowSinglePack ? "ซอง" : "กล่อง"}
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100"
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

              {/* Pre-Order Toggle & Release Date */}
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
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group"
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-700 hover:border-gold-400 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-gold-300 transition-colors">
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

              {/* Variants Configuration */}
              <div className="p-4 rounded-2xl bg-[#131b2e] border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <label className="text-xs font-bold text-gold-300 uppercase tracking-wider block">
                    กำหนดราคาของแต่ละขนาด (Variants)
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-[#0b0f19] px-3 py-1.5 rounded-xl border border-slate-800 hover:border-gold-500/40 transition-colors self-start sm:self-auto">
                    <input
                      type="checkbox"
                      checked={allowSinglePack}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAllowSinglePack(checked);
                        if (!checked) {
                          if (baseUnitName === "ซอง") setBaseUnitName("กล่อง");
                          setPacksPerBox(1);
                          setVariants((prev) =>
                            prev.map((v) => {
                              if (v.type === VariantType.BOOSTER_BOX) return { ...v, multiplier: 1 };
                              if (v.type === VariantType.CARTON_CASE) return { ...v, multiplier: boxesPerCarton };
                              return v;
                            })
                          );
                        } else {
                          if (baseUnitName === "กล่อง") setBaseUnitName("ซอง");
                          setPacksPerBox(16);
                          setVariants((prev) =>
                            prev.map((v) => {
                              if (v.type === VariantType.SINGLE_PACK) return { ...v, multiplier: 1 };
                              if (v.type === VariantType.BOOSTER_BOX) return { ...v, multiplier: 16 };
                              if (v.type === VariantType.CARTON_CASE) return { ...v, multiplier: 16 * boxesPerCarton };
                              return v;
                            })
                          );
                        }
                      }}
                      className="rounded border-slate-700 text-gold-500 w-4 h-4 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      📦 เปิดขายแบบซอง (Single Pack)
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  {variants
                    .filter((v) => allowSinglePack || v.type !== VariantType.SINGLE_PACK)
                    .map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center p-2 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="text-[11px] text-slate-400 block">ชื่อตัวเลือก</span>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const newV = [...variants];
                            newV[idx].name = e.target.value;
                            setVariants(newV);
                          }}
                          className="w-full bg-transparent font-semibold text-slate-200 focus:outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">ราคา (บาท)</span>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => {
                            const newV = [...variants];
                            newV[idx].price = parseFloat(e.target.value) || 0;
                            setVariants(newV);
                          }}
                          className="w-full bg-transparent font-mono text-gold-300 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">ตัวคูณ Base Unit</span>
                        <input
                          type="number"
                          value={v.multiplier}
                          onChange={(e) => {
                            const newV = [...variants];
                            newV[idx].multiplier = parseInt(e.target.value) || 1;
                            setVariants(newV);
                          }}
                          className="w-full bg-transparent font-mono text-slate-300 focus:outline-none"
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400">
                          เทียบเท่า {v.multiplier} {baseUnitName}
                        </span>
                      </div>
                    </div>
                  ))}
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
