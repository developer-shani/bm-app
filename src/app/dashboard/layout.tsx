"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="pl-0 md:pl-[260px] transition-all duration-300 min-h-screen flex flex-col flex-1">
        <AdminHeader onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
