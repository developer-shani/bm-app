"use client";
export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Wallet,
  Handshake,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  CreditCard,
  Plus,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";

// Stats card component
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend?: "up" | "down";
  trendValue?: string;
  className?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1">
              {trend && (
                <span
                  className={
                    trend === "up" ? "text-green-500" : "text-red-500"
                  }
                >
                  {trend === "up" ? (
                    <ArrowUpRight className="w-3.5 h-3.5 inline" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 inline" />
                  )}
                  <span className="text-xs font-medium ml-0.5">{trendValue}</span>
                </span>
              )}
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-primary/20">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Overview of your business performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/recovery" className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs sm:text-sm h-9">
              <CreditCard className="w-3.5 h-3.5" />
              Add Recovery
            </Button>
          </Link>
          <Link href="/dashboard/customers/new" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full gap-1.5 gradient-primary text-xs sm:text-sm h-9">
              <Plus className="w-3.5 h-3.5" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Customers"
          value="0"
          description="All time customers"
          icon={Users}
          trend="up"
          trendValue="0%"
        />
        <StatsCard
          title="Active Installments"
          value="0"
          description="Currently running"
          icon={CreditCard}
        />
        <StatsCard
          title="Total Investment"
          value="Rs. 0"
          description="From all investors"
          icon={Wallet}
          trend="up"
          trendValue="0%"
        />
        <StatsCard
          title="Total Profit"
          value="Rs. 0"
          description="Net earnings"
          icon={TrendingUp}
          trend="up"
          trendValue="0%"
        />
      </div>

      {/* Alert Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Overdue Alert Card */}
        <Card className="border-red-500/20 bg-red-500/5 hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/15">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-500">Overdue</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Installments overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Due Soon Card */}
        <Card className="border-yellow-500/20 bg-yellow-500/5 hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-500/15">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-500">Due Soon</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Within 3 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month Collections */}
        <Card className="border-green-500/20 bg-green-500/5 hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15">
                <IndianRupee className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-500">This Month</p>
                <p className="text-2xl font-bold">Rs. 0</p>
                <p className="text-xs text-muted-foreground">Collected amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Customers</CardTitle>
                <CardDescription>Latest installment sales</CardDescription>
              </div>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No customers yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Start by adding your first sale
              </p>
              <Link href="/dashboard/customers/new">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add First Sale
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Investors Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Investors Overview</CardTitle>
                <CardDescription>Capital & balance status</CardDescription>
              </div>
              <Link href="/dashboard/investors">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Wallet className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No investors yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Add investors to track capital
              </p>
              <Link href="/dashboard/investors/new">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Investor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Brands */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Mobile Brands</CardTitle>
          <CardDescription>Most sold phone companies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Smartphone className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Sales data will appear here once you start making sales
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

