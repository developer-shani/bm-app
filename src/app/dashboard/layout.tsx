"use client";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="pl-[260px] transition-all duration-300">
        <AdminHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
