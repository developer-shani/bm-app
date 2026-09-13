"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Handshake, Plus, Search, Phone } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Reseller } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "resellers"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setResellers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reseller)));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = resellers.filter((r) =>
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || r.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Resellers</h1>
          <p className="text-sm text-muted-foreground mt-1">{resellers.length} total resellers</p>
        </div>
        <Link href="/dashboard/resellers/new">
          <Button className="gap-2 gradient-primary"><Plus className="w-4 h-4" /> Add Reseller</Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Handshake className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Resellers Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Search se match nahi mila" : "Resellers sale form se automatically add hote hain"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-lg transition-all hover:border-primary/20 group">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{r.fullName}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {r.phone}
                    </p>
                  </div>
                  <Badge variant={r.status === "active" ? "success" : "secondary"}>{r.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Referrals</p>
                    <p className="font-bold">{r.totalReferrals}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <p className="font-bold text-green-500">{formatCurrency(r.totalCommission)}</p>
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
