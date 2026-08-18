"use client";

import React, { useState } from "react";
import { calculateStockIntake } from "@/lib/stock-calculator";
import { stockIntakeAction } from "@/lib/actions";
import {
  Boxes,
  X,
  Plus,
  ArrowRight,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";

interface StockIntakeModalProps {
  product: {
    id: string;
    code: string;
    name: string;
    baseStock: number;
    baseUnitName: string;
    packsPerBox: number;
    boxesPerCarton: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockIntakeModal({ product, isOpen, onClose, onSuccess }: StockIntakeModalProps) {
  const [cartons, setCartons] = useState<number>(0);
  const [boxes, setBoxes] = useState<number>(0);
  const [packs, setPacks] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const X_ratio = product.packsPerBox || 16;
  const Y_ratio = product.boxesPerCarton || 16;
  const packsPerCarton = X_ratio * Y_ratio;

  const {
    totalPacksFromCartons,
    totalPacksFromBoxes,
    totalPacks,
    totalBaseUnits,
  } = calculateStockIntake(cartons, boxes, packs, X_ratio, Y_ratio);

  const newProjectedBaseStock = product.baseStock + totalBaseUnits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalBaseUnits <= 0) {
      setError("กรุณากรอกจำนวนสินค้าที่ต้องการรับเข้าอย่างน้อย 1 ชิ้น");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await stockIntakeAction(product.id, cartons, boxes, packs);
      if (!res.success) {
        throw new Error(res.error || "เกิดข้อผิดพลาดในการบันทึกสต็อก");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-[#0e1628] border border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/30">
                <Calculator className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                เครื่องคิดเลขรับของเข้า (Stock Intake)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {product.code} - {product.name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Packaging Configuration & Formulas */}
        <div className="p-4 rounded-2xl bg-[#141e33] border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span>อัตราส่วนการบรรจุของสินค้านี้:</span>
            <span className="font-mono text-gold-300">
              1 ลัง = {Y_ratio} กล่อง | 1 กล่อง = {X_ratio} {product.baseUnitName}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>สต็อกเดิมปัจจุบัน:</span>
            <strong className="text-slate-200">{product.baseStock} {product.baseUnitName}</strong>
          </div>
        </div>

        {/* Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Cartons */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                จำนวน ลัง (Cartons)
              </label>
              <input
                type="number"
                min="0"
                value={cartons || ""}
                onChange={(e) => setCartons(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-gold-400"
              />
              <span className="text-[10px] text-slate-400 block">
                ({packsPerCarton} {product.baseUnitName}/ลัง)
              </span>
            </div>

            {/* Boxes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                จำนวน กล่อง (Boxes)
              </label>
              <input
                type="number"
                min="0"
                value={boxes || ""}
                onChange={(e) => setBoxes(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-gold-400"
              />
              <span className="text-[10px] text-slate-400 block">
                ({X_ratio} {product.baseUnitName}/กล่อง)
              </span>
            </div>

            {/* Packs */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                จำนวน {product.baseUnitName} เศษ (Packs)
              </label>
              <input
                type="number"
                min="0"
                value={packs || ""}
                onChange={(e) => setPacks(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-[#131b2e] border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-gold-400"
              />
              <span className="text-[10px] text-slate-400 block">
                (1 {product.baseUnitName}/หน่วย)
              </span>
            </div>
          </div>

          {/* Real-time Math Formula Breakdown Box */}
          <div className="p-4 rounded-2xl bg-black/60 border border-gold-500/40 space-y-2">
            <div className="text-xs font-bold text-gold-300 flex items-center justify-between">
              <span>สูตรการแปลงหน่วย Base Unit:</span>
              <span className="text-sm font-mono text-emerald-400 font-extrabold">
                +{totalBaseUnits} {product.baseUnitName}
              </span>
            </div>

            <div className="font-mono text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
              ({cartons} × {packsPerCarton}) + ({boxes} × {X_ratio}) + {packs} ={" "}
              <strong className="text-gold-300">{totalBaseUnits} {product.baseUnitName}</strong>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <span>สต็อกรวมหลังบันทึก:</span>
              <span className="font-mono font-bold text-white text-sm">
                {product.baseStock} ➔ <strong className="text-gold-300">{newProjectedBaseStock} {product.baseUnitName}</strong>
              </span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={loading || totalBaseUnits <= 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-gold-glow flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              {loading ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันการรับของเข้า</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
