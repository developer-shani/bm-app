"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Plus,
  CreditCard,
  Menu,
} from "lucide-react";

interface MobileBottomNavProps {
  onMenuToggle: () => void;
}

export function MobileBottomNav({ onMenuToggle }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Home",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Customers",
      href: "/dashboard/customers",
      icon: Users,
    },
    {
      title: "New Sale",
      href: "/dashboard/customers/new",
      icon: Plus,
      isAction: true,
    },
    {
      title: "Recovery",
      href: "/dashboard/recovery",
      icon: CreditCard,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/50 py-1.5 px-3 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-around">
      {navItems.slice(0, 2).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 text-xs font-medium",
              isActive
                ? "text-primary font-semibold scale-105"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5 mb-0.5", isActive && "stroke-[2.5px]")} />
            <span>{item.title}</span>
          </Link>
        );
      })}

      {/* Prominent Center Action Button for New Sale */}
      <Link
        href="/dashboard/customers/new"
        className="flex flex-col items-center justify-center -mt-5"
      >
        <div className="w-12 h-12 rounded-full gradient-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform">
          <Plus className="w-6 h-6 stroke-[3px]" />
        </div>
        <span className="text-[10px] font-semibold text-primary mt-0.5">New Sale</span>
      </Link>

      {/* Right Items: Recovery & Menu */}
      {navItems.slice(3).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 text-xs font-medium",
              isActive
                ? "text-primary font-semibold scale-105"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5 mb-0.5", isActive && "stroke-[2.5px]")} />
            <span>{item.title}</span>
          </Link>
        );
      })}

      {/* Menu Toggle Button */}
      <button
        onClick={onMenuToggle}
        type="button"
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-95"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </div>
  );
}
