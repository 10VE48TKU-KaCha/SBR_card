"use client";

import React, { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  Package,
  ChevronDown,
  ShieldCheck,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { getCurrentUserAction, logoutCustomerAction } from "@/lib/actions";

export function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  const { toggleCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    loadUser();

    // Close user dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadUser = async () => {
    try {
      const res = await getCurrentUserAction();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/products");
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logoutCustomerAction();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { label: "สินค้าทั้งหมด", href: "/products" },
    { label: "Cardfight!! Vanguard", href: "/products?franchise=VANGUARD" },
    { label: "Buddyfight", href: "/products?franchise=BUDDYFIGHT" },
    { label: "Yu-Gi-Oh!", href: "/products?franchise=YUGIOH" },
    { label: "Battle Spirits", href: "/products?franchise=BATTLE_SPIRITS" },
    { label: "🔥 สินค้าสั่งจอง (Pre-Order)", href: "/products?preOrder=true" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gold-500/20 bg-[#0b0f19]/95 backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-amber-950/40 via-yellow-900/30 to-amber-950/40 border-b border-gold-500/10 text-xs py-1.5 px-4 text-center text-amber-200/90 font-medium flex items-center justify-between max-w-7xl mx-auto">
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ร้านสุภาพบุรุษการ์ดเกม • ศูนย์รวมการ์ดเกมแท้และอุปกรณ์เสริมพรีเมียม</span>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto">
          {user ? (
            <NextLink
              href="/profile?tab=orders"
              className="hover:text-gold-300 transition-colors flex items-center gap-1 text-slate-300"
            >
              <Package className="w-3 h-3 text-gold-400" />
              <span>ประวัติคำสั่งซื้อของฉัน</span>
            </NextLink>
          ) : (
            <NextLink
              href="/track"
              className="hover:text-gold-300 transition-colors flex items-center gap-1 text-slate-300"
            >
              <Search className="w-3 h-3 text-gold-400" />
              <span>เช็คสถานะคำสั่งซื้อ</span>
            </NextLink>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand Name */}
          <NextLink href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gold-400/80 shadow-gold-glow group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/logos/sp-logo.png"
                alt="ร้านสุภาพบุรุษ โลโก้"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight gold-gradient-text">
                  ร้านสุภาพบุรุษ
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300 border border-gold-500/40 font-mono">
                  CARDS & TOYS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light tracking-wider uppercase">
                Supapburut Card Games
              </p>
            </div>
          </NextLink>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md relative items-center mx-4"
          >
            <input
              type="text"
              placeholder="ค้นหาชื่อการ์ด, รหัสสินค้า เช่น VG-DZ-BT02..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-700/80 rounded-full py-2.5 pl-10 pr-24 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50 transition-all shadow-inner"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-gold-500 hover:bg-gold-400 text-slate-950 text-xs font-semibold rounded-full transition-colors shadow-sm"
            >
              ค้นหา
            </button>
          </form>

          {/* Action Icons & User Account */}
          <div className="flex items-center gap-3">
            {/* User Account Button (Desktop) */}
            {isMounted && (
              <div className="hidden md:block relative" ref={userMenuRef}>
                {user ? (
                  <div>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 py-1.5 pl-2 pr-3 rounded-xl bg-[#131b2e] border border-gold-500/40 hover:border-gold-400 text-slate-200 transition-all shadow-sm"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xs uppercase">
                        {user.name ? user.name.charAt(0) : "U"}
                      </div>
                      <span className="text-xs font-bold max-w-[120px] truncate text-slate-100">
                        {user.name}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f1728] border border-gold-500/30 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3 py-2 border-b border-slate-800">
                          <p className="text-xs font-bold text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>

                        <NextLink
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-gold-300 hover:bg-slate-800/60 transition-colors"
                        >
                          <User className="w-4 h-4 text-gold-400" />
                          <span>โปรไฟล์ & ที่อยู่จัดส่ง</span>
                        </NextLink>

                        <NextLink
                          href="/profile?tab=orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-gold-300 hover:bg-slate-800/60 transition-colors"
                        >
                          <Package className="w-4 h-4 text-gold-400" />
                          <span>ประวัติคำสั่งซื้อของฉัน</span>
                        </NextLink>

                        <div className="pt-1 border-t border-slate-800">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>ออกจากระบบ</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <NextLink
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131b2e] border border-slate-700/80 hover:border-gold-400 text-xs font-bold text-slate-200 hover:text-gold-300 transition-all shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5 text-gold-400" />
                    <span>เข้าสู่ระบบ / สมัคร</span>
                  </NextLink>
                )}
              </div>
            )}

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-2.5 rounded-xl bg-[#131b2e] border border-slate-700/80 hover:border-gold-400/60 text-slate-200 hover:text-gold-300 transition-all group"
              aria-label="ตะกร้าสินค้า"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0b0f19] shadow-md animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-[#131b2e] border border-slate-700/80 text-slate-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Category Navigation Bar (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 border-t border-slate-800/80 py-2.5 overflow-x-auto scrollbar-none text-sm">
          {navLinks.map((link) => (
            <NextLink
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-gold-300 hover:bg-white/5 transition-all text-xs font-medium whitespace-nowrap"
            >
              {link.label}
            </NextLink>
          ))}
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0b0f19] px-4 pt-3 pb-6 space-y-4">
          {/* User Status Bar for Mobile */}
          {user ? (
            <div className="p-3 rounded-2xl bg-[#131b2e] border border-gold-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xs">
                  {user.name ? user.name.charAt(0) : "U"}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <NextLink
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-gold-500 text-slate-950 font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ</span>
              </NextLink>
              <NextLink
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs text-center flex items-center justify-center gap-1.5"
              >
                <span>สมัครสมาชิก</span>
              </NextLink>
            </div>
          )}

          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อการ์ด, รหัสสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-700 rounded-lg py-2 pl-9 pr-16 text-sm text-slate-200"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-gold-500 text-slate-950 text-xs font-semibold rounded-md"
            >
              ค้นหา
            </button>
          </form>

          {/* Mobile Nav Links */}
          <div className="flex flex-col space-y-1">
            {user && (
              <>
                <NextLink
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-gold-300 hover:bg-slate-800/50 text-sm font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>โปรไฟล์ & ที่อยู่จัดส่ง</span>
                </NextLink>
                <NextLink
                  href="/profile?tab=orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-gold-300 hover:bg-slate-800/50 text-sm font-medium flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>ประวัติคำสั่งซื้อของฉัน</span>
                </NextLink>
              </>
            )}

            {navLinks.map((link) => (
              <NextLink
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-gold-300 hover:bg-slate-800/50 text-sm font-medium"
              >
                {link.label}
              </NextLink>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-center items-center text-xs">
            <NextLink
              href="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-400 hover:text-gold-300 font-medium"
            >
              🔍 ตรวจสอบสถานะคำสั่งซื้อทั่วไป
            </NextLink>
          </div>
        </div>
      )}
    </header>
  );
}
