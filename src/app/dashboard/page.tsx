"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Phone,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Customer, Investor, Reseller } from "@/types";
import { formatCurrency, formatDate, getInstallmentStatus, cn } from "@/lib/utils";

function SkeletonStatsCard() {
  return (
    <Card className="hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-11 h-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend?: "up" | "down";
  trendValue?: string;
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
                <span className={trend === "up" ? "text-green-500" : "text-red-500"}>
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    // 1. Real-time Customers Listener
    const qCust = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsubCust = onSnapshot(qCust, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("bm_cached_customers", JSON.stringify(data));
      }
      setLoading(false);
    }, (err) => console.warn("Cust realtime sync warn:", err));

    // 2. Real-time Investors Listener
    const qInv = query(collection(db, "investors"), orderBy("createdAt", "desc"));
    const unsubInv = onSnapshot(qInv, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Investor));
      setInvestors(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("bm_cached_investors", JSON.stringify(data));
      }
      setLoadedCount(prev => prev + 1);
    }, (err) => console.warn("Inv realtime sync warn:", err));

    // 3. Real-time Resellers Listener
    const qRes = query(collection(db, "resellers"), orderBy("createdAt", "desc"));
    const unsubRes = onSnapshot(qRes, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reseller));
      setResellers(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("bm_cached_resellers", JSON.stringify(data));
      }
      setLoadedCount(prev => prev + 1);
    }, (err) => console.warn("Res realtime sync warn:", err));

    // 4. Real-time Recoveries Listener
    const qRec = query(collection(db, "recoveries"), orderBy("date", "desc"));
    const unsubRec = onSnapshot(qRec, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecoveries(data);
      setLoadedCount(prev => prev + 1);
    }, (err) => console.warn("Rec realtime sync warn:", err));

    return () => {
      unsubCust();
      unsubInv();
      unsubRes();
      unsubRec();
    };
  }, []);


  // Set loading false only after ALL 4 data sources have loaded
  useEffect(() => {
    if (loadedCount >= 4) {
      setLoading(false);
    }
  }, [loadedCount]);

  // Dynamic Calculations
  const activeInstallments = customers.filter((c) => c.status === "active").length;
  const totalInvestment = investors.reduce((sum, inv) => sum + (inv.totalInvestment || 0), 0);
  const totalProfit = customers.reduce((sum, c) => sum + (c.profitAmount || 0), 0);

  const overdueCount = customers.filter(
    (c) => c.status === "active" && getInstallmentStatus(c.nextDueDate) === "overdue"
  ).length;

  const dueSoonCount = customers.filter(
    (c) => c.status === "active" && getInstallmentStatus(c.nextDueDate) === "due-soon"
  ).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthCollected = recoveries
    .filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + (r.amount || 0), 0);


  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-40" /></CardContent></Card>
          <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-40" /></CardContent></Card>
          <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-40" /></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent className="space-y-3">{[1,2,3].map(i => <div key={i} className="flex items-center gap-3 p-3 border rounded-lg"><Skeleton className="w-8 h-8 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-40" /></div><Skeleton className="h-5 w-16 rounded-full" /></div>)}</CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent className="space-y-3">{[1,2,3].map(i => <div key={i} className="flex items-center gap-3 p-3 border rounded-lg"><Skeleton className="w-8 h-8 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-40" /></div><Skeleton className="h-5 w-16 rounded-full" /></div>)}</CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Live Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Real-time business performance across all devices
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatsCard
          title="Total Investment"
          value={formatCurrency(totalInvestment)}
          description="From all investors"
          icon={Wallet}
          trend="up"
          trendValue="Live"
        />
        <StatsCard
          title="Total Investors"
          value={investors.length.toString()}
          description="Active capital partners"
          icon={Handshake}
          trend="up"
          trendValue="Live"
        />
        <StatsCard
          title="Total Expected Profit"
          value={formatCurrency(totalProfit)}
          description="Net profit pipeline"
          icon={TrendingUp}
          trend="up"
          trendValue="Live"
        />
        <StatsCard
          title="Total Customers"
          value={customers.length.toString()}
          description="All time customers"
          icon={Users}
          trend="up"
          trendValue="Live"
        />
        <StatsCard
          title="Active Installments"
          value={activeInstallments.toString()}
          description="Currently running"
          icon={CreditCard}
        />
      </div>

      {/* Alert Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
<Card className="border-green-500/20 bg-green-500/5 hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15">
                <IndianRupee className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-500">This Month Collected</p>
                <p className="text-2xl font-bold">{formatCurrency(thisMonthCollected)}</p>
                <p className="text-xs text-muted-foreground">Real-time recovery total</p>
              </div>
            </div>
          </CardContent>
        </Card>

<Card className="border-red-500/20 bg-red-500/5 hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/15">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-500">Overdue</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-xs text-muted-foreground">Installments overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

<Card className="border-yellow-500/20 bg-yellow-500/5 hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-500/15">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-500">Due Soon</p>
                <p className="text-2xl font-bold">{dueSoonCount}</p>
                <p className="text-xs text-muted-foreground">Within 3 days</p>
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
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
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
            ) : (
              <div className="space-y-3">
                {customers.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border hover:bg-muted/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> {c.mobileCompany} {c.mobileModel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.monthlyInstallment)} / mo
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Rem: {formatCurrency(c.remainingAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {investors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
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
            ) : (
              <div className="space-y-3">
                {investors.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border hover:bg-muted/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{inv.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Ratio: {inv.sharingRatio}% / {100 - inv.sharingRatio}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">
                        {formatCurrency(inv.totalInvestment)}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Avail: {formatCurrency(inv.availableBalance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
