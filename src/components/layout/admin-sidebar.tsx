"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Handshake,
  CreditCard,
  BarChart3,
  Settings,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "All Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Users & Partners",
    href: "/dashboard/users",
    icon: UserCheck,
  },
  {
    title: "All Investors",
    href: "/dashboard/investors",
    icon: Wallet,
  },
  {
    title: "All Resellers",
    href: "/dashboard/resellers",
    icon: Handshake,
  },
  {
    title: "Recovery",
    href: "/dashboard/recovery",
    icon: CreditCard,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Losses",
    href: "/dashboard/losses",
    icon: AlertTriangle,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const quickActions = [
  {
    title: "New Sale",
    href: "/dashboard/customers/new",
    icon: Plus,
  },
  {
    title: "Add Recovery",
    href: "/dashboard/recovery",
    icon: CreditCard,
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border/50 bg-background/95 md:bg-card/50 backdrop-blur-xl transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "md:w-[68px]" : "md:w-[260px]",
          "w-[260px]",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="animate-fade-in">
                <h2 className="text-sm font-bold tracking-tight whitespace-nowrap">
                  Brother Mobiles
                </h2>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  Sales Manager
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="md:hidden h-8 w-8 text-muted-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        {(!collapsed || mobileOpen) && (
          <div className="px-3 pt-4 pb-2 space-y-1 animate-fade-in">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} onClick={() => onCloseMobile?.()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 text-xs border-dashed border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.title}
                </Button>
              </Link>
            ))}
          </div>
        )}

        <Separator className="mx-3 w-auto" />

        {/* Navigation Links */}
        <ScrollArea className="flex-1 px-3 py-2">
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname?.startsWith(link.href));

              return (
                <Link key={link.href} href={link.href} onClick={() => onCloseMobile?.()}>
                  <div
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                    )}
                  >
                    <link.icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {(!collapsed || mobileOpen) && (
                      <span className="whitespace-nowrap">{link.title}</span>
                    )}
                    {isActive && (!collapsed || mobileOpen) && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center h-8 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  </>
);
}
