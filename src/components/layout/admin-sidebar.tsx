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
  Plus,
  Bell,
  AlertTriangle,
  UserCheck,
  Trash2,
  X,
} from "lucide-react";

const sidebarLinks = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users & Partners", href: "/dashboard/users", icon: UserCheck },
  { title: "All Investors", href: "/dashboard/investors", icon: Wallet },
  { title: "All Resellers", href: "/dashboard/resellers", icon: Handshake },
  { title: "All Customers", href: "/dashboard/customers", icon: Users },
  { title: "Recovery", href: "/dashboard/recovery", icon: CreditCard },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { title: "Losses", href: "/dashboard/losses", icon: AlertTriangle },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { title: "Delete History", href: "/dashboard/trash", icon: Trash2 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const quickActions = [
  { title: "New Sale", href: "/dashboard/customers/new", icon: Plus },
  { title: "Add Recovery", href: "/dashboard/recovery", icon: CreditCard },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight whitespace-nowrap">Brother Mobiles</h2>
          <p className="text-[10px] text-muted-foreground whitespace-nowrap">Sales Manager</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 pt-4 pb-2 space-y-1 shrink-0">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} onClick={onLinkClick}>
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

      <Separator className="mx-3 w-auto shrink-0" />

      {/* Navigation Links */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname?.startsWith(link.href));

            return (
              <Link key={link.href} href={link.href} onClick={onLinkClick}>
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
                  <span className="whitespace-nowrap">{link.title}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </>
  );
}

export function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  return (
    <>
      {/* ===== DESKTOP SIDEBAR (always visible, hidden on mobile) ===== */}
      <aside className="hidden md:flex fixed left-0 top-0 z-50 h-screen w-[260px] border-r border-border/50 bg-card/50 backdrop-blur-xl flex-col">
        <SidebarContent />
      </aside>

      {/* ===== MOBILE DRAWER (only rendered when open) ===== */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <aside className="fixed left-0 top-0 z-[70] h-screen w-[280px] bg-background border-r border-border/50 shadow-2xl flex flex-col md:hidden animate-slide-in-left">
            {/* Close button */}
            <button
              onClick={onCloseMobile}
              className="absolute top-4 right-3 z-10 w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onLinkClick={onCloseMobile} />
          </aside>
        </>
      )}
    </>
  );
}
