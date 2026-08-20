import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { CardLanguage, GameFranchise, VariantType } from "@prisma/client";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  Filter,
  Search,
  SlidersHorizontal,
  Flame,
  Package,
  Layers,
  Sparkles,
  ArrowUpDown,
  X,
  ShieldCheck,
} from "lucide-react";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    franchise?: string;
    preOrder?: string;
    type?: string;
    category?: string; // "all" | "sealed" | "single"
    rarity?: string;
    lang?: string;
    sort?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Await searchParams in Next.js 15
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const selectedFranchise = resolvedParams.franchise as GameFranchise | undefined;
  const isPreOrderFilter = resolvedParams.preOrder === "true";
  const selectedVariantType = resolvedParams.type as VariantType | undefined;
  const categoryFilter = resolvedParams.category || "all"; // "all", "sealed", "single"
  const selectedRarity = resolvedParams.rarity || "";
  const selectedLang = resolvedParams.lang as CardLanguage | undefined;
  const sort = resolvedParams.sort || "newest";

  // Build Prisma query filters
  const where: any = {
    isActive: true,
  };

  if (categoryFilter === "single") {
    where.isSingleCard = true;
  } else if (categoryFilter === "sealed") {
    where.isSingleCard = false;
  }

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { code: { contains: query, mode: "insensitive" } },
      { cardNumber: { contains: query, mode: "insensitive" } },
      { rarity: { contains: query, mode: "insensitive" } },
      { clanNation: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (selectedFranchise && Object.values(GameFranchise).includes(selectedFranchise)) {
    where.franchise = selectedFranchise;
  }

  if (isPreOrderFilter) {
    where.isPreOrder = true;
  }

  if (selectedVariantType && Object.values(VariantType).includes(selectedVariantType)) {
    where.variants = {
      some: {
        type: selectedVariantType,
      },
    };
  }

  if (selectedRarity) {
    where.rarity = { equals: selectedRarity, mode: "insensitive" };
  }

  if (selectedLang && Object.values(CardLanguage).includes(selectedLang)) {
    where.cardLanguage = selectedLang;
  }

  // Sorting
  let orderBy: any = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  if (sort === "code") orderBy = { code: "asc" };

  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
      },
      orderBy,
    });
  } catch (error) {
    console.error("ProductsPage data fetch error:", error);
  }

  const franchiseList = [
    { value: "", label: "ทั้งหมด" },
    { value: GameFranchise.VANGUARD, label: "Cardfight!! Vanguard" },
    { value: GameFranchise.BUDDYFIGHT, label: "Future Card Buddyfight" },
    { value: GameFranchise.YUGIOH, label: "Yu-Gi-Oh!" },
    { value: GameFranchise.BATTLE_SPIRITS, label: "Battle Spirits" },
    { value: GameFranchise.OTHER, label: "อุปกรณ์เสริม & อื่นๆ" },
  ];

  const variantTypeList = [
    { value: "", label: "ทุกประเภทบรรจุ" },
    { value: VariantType.SINGLE_PACK, label: "แบบซอง (Single Pack)" },
    { value: VariantType.BOOSTER_BOX, label: "แบบกล่อง (Booster Box)" },
    { value: VariantType.CARTON_CASE, label: "แบบลัง (Carton Case)" },
    { value: VariantType.STARTER_DECK, label: "กล่องพร้อมเล่น (Starter Deck)" },
  ];

  const popularRarities = ["DSR", "FFR", "SP", "SEC", "RRR", "RR", "R", "QCS", "Secret"];

  const hasActiveFilters =
    Boolean(query) ||
    Boolean(selectedFranchise) ||
    isPreOrderFilter ||
    Boolean(selectedVariantType) ||
    categoryFilter !== "all" ||
    Boolean(selectedRarity) ||
    Boolean(selectedLang);

  // Helper to construct query params
  const makeFilterUrl = (overrides: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      ...(query && { q: query }),
      ...(selectedFranchise && { franchise: selectedFranchise }),
      ...(isPreOrderFilter && { preOrder: "true" }),
      ...(selectedVariantType && { type: selectedVariantType }),
      ...(categoryFilter !== "all" && { category: categoryFilter }),
      ...(selectedRarity && { rarity: selectedRarity }),
      ...(selectedLang && { lang: selectedLang }),
      ...overrides,
    };

    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }

    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/" className="hover:text-gold-400">
              หน้าแรก
            </Link>
            <span>/</span>
            <span className="text-slate-200">
              {categoryFilter === "single"
                ? "การ์ดแยกใบ (Single Cards)"
                : categoryFilter === "sealed"
                ? "สินค้าซีลด์ (Sealed Products)"
                : "แคตตาล็อกสินค้า"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            {categoryFilter === "single" ? (
              <>
                <span className="text-2xl">🃏</span>
                <span>การ์ดแยกใบ (Single Cards) ({products.length} รายการ)</span>
              </>
            ) : (
              <>
                <Layers className="w-6 h-6 text-gold-400" />
                <span>สินค้าทั้งหมด ({products.length} รายการ)</span>
              </>
            )}
          </h1>
        </div>

        {/* Search Input */}
        <form method="GET" action="/products" className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="ค้นหาชื่อการ์ด, รหัสการ์ด, เนชั่น, Rarity..."
              className="w-full bg-[#12192b] border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-gold-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {selectedFranchise && <input type="hidden" name="franchise" value={selectedFranchise} />}
          {isPreOrderFilter && <input type="hidden" name="preOrder" value="true" />}
          {categoryFilter !== "all" && <input type="hidden" name="category" value={categoryFilter} />}
          {selectedRarity && <input type="hidden" name="rarity" value={selectedRarity} />}
          {selectedLang && <input type="hidden" name="lang" value={selectedLang} />}
          <button
            type="submit"
            className="px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Category Tab Selector (All | Sealed | Single Cards) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0e1628] rounded-2xl border border-slate-800 w-fit">
        <Link
          href={makeFilterUrl({ category: null })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            categoryFilter === "all"
              ? "bg-gold-500 text-slate-950 shadow-gold-glow"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ทั้งหมด (All Products)</span>
        </Link>

        <Link
          href={makeFilterUrl({ category: "single", type: null })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            categoryFilter === "single"
              ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow"
              : "text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30"
          }`}
        >
          <span>🃏</span>
          <span>การ์ดแยกใบ (Single Cards)</span>
        </Link>

        <Link
          href={makeFilterUrl({ category: "sealed", rarity: null, lang: null })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            categoryFilter === "sealed"
              ? "bg-gold-500 text-slate-950 shadow-gold-glow"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>กล่อง & ซอง (Sealed)</span>
        </Link>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-6 bg-[#0f1728] p-5 rounded-2xl border border-slate-800 sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <SlidersHorizontal className="w-4 h-4 text-gold-400" />
              <span>ตัวกรองสินค้า</span>
            </div>
            {hasActiveFilters && (
              <Link
                href="/products"
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>ล้างตัวกรอง</span>
              </Link>
            )}
          </div>

          {/* Franchise Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gold-300 block uppercase tracking-wider">
              แฟรนไชส์เกม (Franchise)
            </label>
            <div className="space-y-1">
              {franchiseList.map((f) => {
                const isActive = (selectedFranchise || "") === f.value;
                return (
                  <Link
                    key={f.value}
                    href={makeFilterUrl({ franchise: f.value || null })}
                    className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-gold-500 text-slate-950 font-bold shadow-md"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Single Card Specific Filters (Rarity & Language) */}
          {categoryFilter === "single" && (
            <>
              {/* Rarity Filter */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gold-300 block uppercase tracking-wider">
                    ระดับความหายาก (Rarity)
                  </label>
                  {selectedRarity && (
                    <Link
                      href={makeFilterUrl({ rarity: null })}
                      className="text-[10px] text-slate-400 hover:text-slate-200"
                    >
                      ทั้งหมด
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularRarities.map((r) => {
                    const isActive = selectedRarity.toUpperCase() === r.toUpperCase();
                    return (
                      <Link
                        key={r}
                        href={makeFilterUrl({ rarity: isActive ? null : r })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border ${
                          isActive
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                            : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-gold-500/50 hover:text-gold-300"
                        }`}
                      >
                        {r}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Language Filter */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-gold-300 block uppercase tracking-wider">
                  ภาษาการ์ด (Language)
                </label>
                <div className="space-y-1">
                  {[
                    { val: "", label: "ทุกภาษา" },
                    { val: "TH", label: "ภาษาไทย (TH)" },
                    { val: "JP", label: "ภาษาญี่ปุ่น (JP)" },
                    { val: "EN", label: "ภาษาอังกฤษ (EN)" },
                  ].map((l) => {
                    const isActive = (selectedLang || "") === l.val;
                    return (
                      <Link
                        key={l.val}
                        href={makeFilterUrl({ lang: l.val || null })}
                        className={`block px-3 py-1.5 rounded-lg text-xs transition-all ${
                          isActive
                            ? "bg-slate-700 text-white font-bold"
                            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                        }`}
                      >
                        {l.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Pre-Order Toggle (Sealed only) */}
          {categoryFilter !== "single" && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-gold-300 block uppercase tracking-wider">
                สถานะสินค้า
              </label>
              <div className="flex flex-col gap-1">
                <Link
                  href={makeFilterUrl({ preOrder: null })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    !isPreOrderFilter
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800/40"
                  }`}
                >
                  สินค้าทั้งหมด (พร้อมส่ง & สั่งจอง)
                </Link>

                <Link
                  href={makeFilterUrl({ preOrder: "true" })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                    isPreOrderFilter
                      ? "bg-rose-600 text-white font-bold"
                      : "text-rose-400 hover:bg-rose-950/40 border border-rose-500/20"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>สินค้าพรีออเดอร์เท่านั้น</span>
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* Packaging Type Filter (Sealed only) */}
          {categoryFilter !== "single" && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-gold-300 block uppercase tracking-wider">
                ประเภทการบรรจุ
              </label>
              <div className="space-y-1">
                {variantTypeList.map((v) => {
                  const isActive = (selectedVariantType || "") === v.value;
                  return (
                    <Link
                      key={v.value}
                      href={makeFilterUrl({ type: v.value || null })}
                      className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-slate-700 text-white font-semibold"
                          : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                      }`}
                    >
                      {v.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Right Product Grid */}
        <div className="lg:col-span-9 space-y-6">
          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap text-xs bg-[#0f1728] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400">กำลังกรอง:</span>
              {categoryFilter === "single" && (
                <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1">
                  <span>🃏 การ์ดแยกใบ (Single Cards)</span>
                </span>
              )}
              {categoryFilter === "sealed" && (
                <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-700">
                  กล่อง & ซอง (Sealed)
                </span>
              )}
              {query && (
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-gold-300 border border-slate-700">
                  คำค้น: "{query}"
                </span>
              )}
              {selectedFranchise && (
                <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  แฟรนไชส์: {selectedFranchise}
                </span>
              )}
              {selectedRarity && (
                <span className="px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  Rarity: {selectedRarity}
                </span>
              )}
              {selectedLang && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ภาษา: {selectedLang}
                </span>
              )}
              {isPreOrderFilter && (
                <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                  เฉพาะพรีออเดอร์
                </span>
              )}
              {selectedVariantType && (
                <span className="px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  ประเภท: {selectedVariantType}
                </span>
              )}
            </div>
          )}

          {/* Product Cards */}
          {products.length === 0 ? (
            <div className="text-center py-20 bg-[#0f1728] rounded-3xl border border-slate-800 p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Package className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">ไม่พบสินค้าที่ตรงกับเงื่อนไข</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ลองค้นหาด้วยรหัสการ์ด, ชื่อการ์ด, หรือล้างตัวกรองเพื่อดูสินค้าทั้งหมดที่มีอยู่ในร้านสุภาพบุรุษ
              </p>
              <Link
                href="/products"
                className="inline-block px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                ล้างตัวกรองทั้งหมด
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
