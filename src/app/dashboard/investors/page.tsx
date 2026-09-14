"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Plus,
  Search,
  ArrowUpRight,
  Phone,
  CreditCard,
  Percent,
  MoreVertical,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { Investor } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bm_cached_investors");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInvestors(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    }

    const q = query(collection(db, "investors"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Investor));
        setInvestors(data);
        setLoading(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("bm_cached_investors", JSON.stringify(data));
        }
      },
      (err) => {
        console.warn("Investors realtime sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredInvestors = investors.filter(
    (inv) =>
      inv.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.cnic.includes(searchQuery) ||
      inv.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Investors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage investor accounts & track investments
          </p>
        </div>
        <Link href="/dashboard/investors/new">
          <Button className="gap-2 gradient-primary">
            <Plus className="w-4 h-4" />
            Add Investor
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, CNIC, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Investors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInvestors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Investors Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Koi investor is search se match nahi karta"
                : "Abhi tak koi investor add nahi hua"}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/investors/new">
                <Button className="gap-2 gradient-primary">
                  <Plus className="w-4 h-4" />
                  Add First Investor
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvestors.map((investor) => {
            const isLowBalance = investor.availableBalance < 10000;
            return (
              <Card
                key={investor.id}
                className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Investor Name & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {investor.fullName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{investor.phone}</span>
                      </div>
                    </div>
                    <Badge variant={investor.status === "active" ? "success" : "secondary"}>
                      {investor.status}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Balance & Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Available Balance</span>
                      <span className={`text-sm font-bold ${isLowBalance ? "text-red-500" : "text-green-500"}`}>
                        {formatCurrency(investor.availableBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Investment</span>
                      <span className="text-sm font-medium">{formatCurrency(investor.totalInvestment)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Profit</span>
                      <span className="text-sm font-medium text-green-500">{formatCurrency(investor.totalProfit)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Active Sets</span>
                      <Badge variant="outline" className="text-xs">
                        {investor.activeInstallments} mobiles
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Sharing Ratio</span>
                      <div className="flex items-center gap-1">
                        <Percent className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {investor.sharingRatio} / {100 - investor.sharingRatio}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

