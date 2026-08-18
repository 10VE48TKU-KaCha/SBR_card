"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { calculateHierarchyStocks } from "@/lib/stock-calculator";
import { StockIntakeModal } from "@/components/admin/StockIntakeModal";
import {
  Boxes,
  Plus,
  Package,
  ArrowUpDown,
  Calculator,
  Layers,
  Sparkles,
  Info,
  ExternalLink,
  Eye,
} from "lucide-react";

interface ProductInventoryItem {
  id: string;
  code: string;
  name: string;
  franchise: string;
  images: string[];
  baseStock: number;
  baseUnitName: string;
  packsPerBox: number;
  boxesPerCarton: number;
}

export function InventoryClient({
  initialProducts,
}: {
  initialProducts: ProductInventoryItem[];
}) {
  const [products, setProducts] = useState<ProductInventoryItem[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<ProductInventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenIntake = (product: ProductInventoryItem) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-gold-400" />
            <span>คลังสินค้า & เครื่องคิดเลขรับของเข้า</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ระบบคำนวณและกระจายสต็อกเชื่อมโยง ลัง (Carton) ➔ กล่อง (Box) ➔ ซอง (Pack)
          </p>
        </div>
      </div>

      {/* Info Card on Hierarchical Calculation Formula */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#162138] via-[#10182a] to-[#0d1424] border border-gold-500/30 text-xs text-slate-300 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-gold-300 font-bold text-sm">
          <Info className="w-4 h-4 text-gold-400" />
          <span>หลักการคำนวณสต็อกระดับอะตอม (Hierarchical Linked Stock System)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
            <strong className="text-slate-200 block">1. ระดับลัง (Carton Stock):</strong>
            <span className="font-mono text-gold-300 text-[11px]">
              Math.floor(baseStock / (X × Y))
            </span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
            <strong className="text-slate-200 block">2. ระดับกล่อง (Box Stock):</strong>
            <span className="font-mono text-gold-300 text-[11px]">
              Math.floor(baseStock / X)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
            <strong className="text-slate-200 block">3. ระดับซอง (Pack Stock):</strong>
            <span className="font-mono text-gold-300 text-[11px]">
              Math.floor(baseStock / 1)
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="p-6 rounded-3xl bg-[#0e1628] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">สินค้า</th>
                <th className="pb-3 font-semibold">อัตราส่วนบรรจุ (X/Y)</th>
                <th className="pb-3 font-semibold text-center">คงเหลือ (ลัง)</th>
                <th className="pb-3 font-semibold text-center">คงเหลือ (กล่อง)</th>
                <th className="pb-3 font-semibold text-center">คงเหลือ (ซอง/หน่วยย่อย)</th>
                <th className="pb-3 font-semibold text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {products.map((p) => {
                const hierarchy = calculateHierarchyStocks({
                  baseStock: p.baseStock,
                  packsPerBox: p.packsPerBox,
                  boxesPerCarton: p.boxesPerCarton,
                });

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
                          <span className="font-mono font-bold text-slate-200">{p.code}</span>
                          <div className="text-slate-300 font-medium line-clamp-1 max-w-xs">
                            {p.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 font-mono text-slate-300">
                      <div>
                        1 กล่อง = <strong>{p.packsPerBox}</strong> {p.baseUnitName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        1 ลัง = <strong>{p.boxesPerCarton}</strong> กล่อง (
                        {p.packsPerBox * p.boxesPerCarton} {p.baseUnitName})
                      </div>
                    </td>

                    <td className="py-3.5 text-center font-mono">
                      <span className="text-sm font-bold text-purple-300 bg-purple-950/60 px-3 py-1 rounded-lg border border-purple-800/60">
                        {hierarchy.cartonStock} ลัง
                      </span>
                    </td>

                    <td className="py-3.5 text-center font-mono">
                      <span className="text-sm font-bold text-blue-300 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/60">
                        {hierarchy.boxStock} กล่อง
                      </span>
                    </td>

                    <td className="py-3.5 text-center font-mono">
                      <span className="text-base font-extrabold text-gold-300 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-800/60">
                        {hierarchy.packStock} {p.baseUnitName}
                      </span>
                    </td>

                    <td className="py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenIntake(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-gold-glow inline-flex items-center gap-1.5 transition-all"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>รับของเข้า (Intake)</span>
                      </button>

                      <Link
                        href={`/products/${p.code}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 inline-flex items-center"
                        title="ดูหน้าร้าน"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Intake Modal Component */}
      {selectedProduct && (
        <StockIntakeModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
