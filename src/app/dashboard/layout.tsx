"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!appUser) {
        router.push("/");
      } else if (appUser.role === "investor") {
        router.push("/investor/portal");
      } else if (appUser.role === "reseller") {
        router.push("/reseller/portal");
      }
    }
  }, [appUser, loading, router]);

  if (loading || !appUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col flex-1 pb-20 lg:pb-0",
          "pl-0",
          collapsed ? "lg:pl-[68px]" : "lg:pl-[260px]"
        )}
      >
        <AdminHeader onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
      <MobileBottomNav onMenuToggle={() => setMobileOpen(!mobileOpen)} />
    </div>
  );
}
