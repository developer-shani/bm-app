"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Search,
  Ban,
  IndianRupee,
  Calendar,
  Smartphone,
  User,
  Filter,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Customer } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { splitByRatio } from "@/lib/calculations";

export default function LossesPage() {
  const [losses, setLosses] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadLosses();
  }, []);

  const loadLosses = async () => {
    try {
      const snap = await getDocs(query(collection(db, "customers"), where("status", "==", "defaulted")));
      setLosses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer)));
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = losses.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.mobileModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLoss = losses.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loss Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{losses.length} defaulted cases</p>
        </div>
        {totalLoss > 0 && (
          <Card className="border-red-500/20 bg-red-500/5 px-4 py-2">
            <p className="text-xs text-muted-foreground">Total Loss</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(totalLoss)}</p>
          </Card>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or model..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Losses</h3>
            <p className="text-sm text-muted-foreground">Alhamdulillah! Koi loss nahi hai abhi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((loss) => (
            <Card key={loss.id} className="border-red-500/20 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{loss.name}</h3>
                      <Badge variant="destructive" className="text-[10px] gap-1"><Ban className="w-2.5 h-2.5" /> Defaulted</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> {loss.mobileCompany} {loss.mobileModel}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(loss.lossDate || loss.createdAt)}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {loss.investorName}</span>
                    </div>
                    {loss.lossReason && (
                      <p className="text-xs bg-red-500/5 rounded-lg p-2 border border-red-500/10 mt-2">
                        <strong>Reason:</strong> {loss.lossReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold text-red-500">{formatCurrency(loss.remainingAmount)}</p>
                    <p className="text-[10px] text-muted-foreground">loss amount</p>
                    <div className="text-[10px] text-muted-foreground">
                      <p>Paid: {formatCurrency(loss.totalPaid)}</p>
                      <p>of {formatCurrency(loss.sellingPrice)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
