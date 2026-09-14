"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, RotateCcw, Search, ShieldAlert, History, Users, Wallet, Handshake, UserCheck, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

interface DeletedRecord {
  id: string;
  originalId: string;
  type: string;
  data: any;
  deletedAt: string;
  deletedBy?: string;
}

export default function TrashHistoryPage() {
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "deleted_records"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeletedRecord));
      list.sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
      setRecords(list);
      setLoading(false);
    }, (err) => {
      console.warn("Trash snapshot warning:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRestore = async (rec: DeletedRecord) => {
    setRestoringId(rec.id);
    try {
      if (rec.originalId && rec.type) {
        const restoreData = { ...rec.data, status: "active", restoredAt: new Date().toISOString() };
        await setDoc(doc(db, rec.type, rec.originalId), restoreData, { merge: true });
      }
      await deleteDoc(doc(db, "deleted_records", rec.id));
      toast.success((rec.data?.name || rec.data?.fullName || "Record") + " restore ho gaya!");
    } catch (e: any) {
      toast.error(e.message || "Restore me masla aya");
    } finally {
      setRestoringId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "customers") return <Users className="w-4 h-4" />;
    if (type === "investors") return <Wallet className="w-4 h-4" />;
    if (type === "resellers") return <Handshake className="w-4 h-4" />;
    return <UserCheck className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    if (type === "customers") return "text-blue-600 bg-blue-500/10 border-blue-500/20";
    if (type === "investors") return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
    if (type === "resellers") return "text-purple-600 bg-purple-500/10 border-purple-500/20";
    return "text-orange-600 bg-orange-500/10 border-orange-500/20";
  };

  const filtered = records.filter((r) => {
    const matchesTab = activeTab === "all" || r.type === activeTab;
    const name = (r.data?.name || r.data?.fullName || r.data?.customerName || "").toLowerCase();
    const phone = (r.data?.phone || r.data?.email || "").toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { key: "all", label: "All", count: records.length },
    { key: "customers", label: "Customers", count: records.filter(r => r.type === "customers").length },
    { key: "investors", label: "Investors", count: records.filter(r => r.type === "investors").length },
    { key: "resellers", label: "Resellers", count: records.filter(r => r.type === "resellers").length },
    { key: "users", label: "Users", count: records.filter(r => r.type === "users").length },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <History className="w-6 h-6 text-destructive" />
            Deleted History (Recycle Bin)
          </h1>
          <p className="text-sm text-muted-foreground">
            Deleted records ka permanent record. Yahan se restore bhi kar sakte hain.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1 text-xs py-1 px-3 border-destructive/30 text-destructive bg-destructive/5">
          <ShieldAlert className="w-3.5 h-3.5" /> Data Loss Protection Active
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 text-xs" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl border">
        {tabs.map((tab) => (
          <Button key={tab.key} variant={activeTab === tab.key ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab.key)} className="text-xs h-8 gap-1">
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Koi deleted record nahi mila</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Jab aap kisi ko delete karenge to wo yahan show hoga</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((rec) => (
            <Card key={rec.id} className="group hover:shadow-md transition-all duration-200 border-destructive/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={"flex items-center justify-center w-10 h-10 rounded-xl border shrink-0 " + getTypeColor(rec.type)}>
                      {getTypeIcon(rec.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{rec.data?.name || rec.data?.fullName || rec.data?.customerName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{rec.data?.email || rec.data?.phone || "N/A"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{rec.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{rec.deletedAt ? new Date(rec.deletedAt).toLocaleDateString("en-PK") : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 shrink-0" onClick={() => handleRestore(rec)} disabled={restoringId === rec.id}>
                    {restoringId === rec.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
