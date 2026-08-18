import React from "react";
import { cookies } from "next/headers";
import { AdminSidebar, AdminNavbar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard | ร้านสุภาพบุรุษ (Supapburut)",
  description: "ระบบจัดการสินค้า คำสั่งซื้อ และสต็อกอัตราส่วนของร้านสุภาพบุรุษ",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("admin_session")?.value === "authenticated";

  // If not authenticated, render only children (Login page layout)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#070a14] text-slate-100 flex">
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
