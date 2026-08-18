import React from "react";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { CartSheet } from "@/components/storefront/CartSheet";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-gold-500 selection:text-slate-950">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartSheet />
    </div>
  );
}
