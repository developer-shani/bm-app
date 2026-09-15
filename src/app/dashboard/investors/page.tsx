"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Plus,
  FileText,
  Eye,
  Search,
  ArrowUpRight,
  Phone,
  CreditCard,
  Percent,
  MoreVertical,
  Upload,
  Camera,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Investor } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { amountToUrduWords } from "@/lib/amount-words";
import { toast } from "sonner";

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Agreement image modal state
  const [viewAgreementUrl, setViewAgreementUrl] = useState<string | null>(null);

  // Add Balance Dialog State
  const [balanceInvestor, setBalanceInvestor] = useState<Investor | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [addNote, setAddNote] = useState("");
  const [balanceProofFile, setBalanceProofFile] = useState<File | null>(null);
  const [balanceProofPreview, setBalanceProofPreview] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);

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

  const handleBalanceProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBalanceProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBalanceProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddBalanceSubmit = async () => {
    if (!balanceInvestor || !addAmount || parseFloat(addAmount) <= 0) {
      toast.error("Meharbani karke valid amount enter karein");
      return;
    }
    setBalanceLoading(true);
    try {
      const amount = parseFloat(addAmount);
      let proofUrl = "";

      if (balanceProofFile) {
        try {
          const proofRef = ref(storage, `investments/${balanceInvestor.id}/${Date.now()}_add_proof`);
          await uploadBytes(proofRef, balanceProofFile);
          proofUrl = await getDownloadURL(proofRef);
        } catch (e) {
          console.warn("Balance proof upload error:", e);
        }
      }

      // Add record to investments history
      await addDoc(collection(db, "investments"), {
        investorId: balanceInvestor.id,
        investorName: balanceInvestor.fullName,
        amount,
        type: "additional",
        ...(proofUrl ? { imageProof: proofUrl } : {}),
        date: new Date().toISOString(),
        note: addNote || "Admin ne additional balance add kiya",
      });

      // Update investor's available balance and total investment
      const newAvail = (balanceInvestor.availableBalance || 0) + amount;
      const newTotal = (balanceInvestor.totalInvestment || 0) + amount;
      await updateDoc(doc(db, "investors", balanceInvestor.id), {
        availableBalance: newAvail,
        totalInvestment: newTotal,
      });

      toast.success(`Rs. ${amount.toLocaleString()} balance successfully add hogaya!`);
      setBalanceInvestor(null);
      setAddAmount("");
      setAddNote("");
      setBalanceProofFile(null);
      setBalanceProofPreview("");
    } catch (err: any) {
      toast.error(err.message || "Balance add karne me masla aya");
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSoftDelete = async (inv: Investor) => {
    if (!confirm(`Kya aap ${inv.fullName} ko trash me bhejna chahte hain?`)) return;
    try {
      await addDoc(collection(db, "deleted_records"), {
        originalId: inv.id,
        type: "investors",
        data: inv,
        deletedAt: new Date().toISOString(),
        deletedBy: "admin",
      });
      await deleteDoc(doc(db, "investors", inv.id));
      toast.success(`${inv.fullName} trash me chala gaya.`);
    } catch (e: any) {
      toast.error(e.message || "Delete karne me masla aya");
    }
  };

  const filteredInvestors = investors.filter(
    (inv) =>
      inv.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Investors</h1>
          <p className="text-sm text-muted-foreground">
            Manage investor accounts & track investments
          </p>
        </div>
        <Link href="/dashboard/investors/new">
          <Button className="gap-2 gradient-primary shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Add Investor
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Investor Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
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
          
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-7 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid gap-4">{[1,2,3,4].map(i => <Card key={i}><CardContent className="p-5"><div className="flex items-center gap-4"><Skeleton className="w-12 h-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-52" /></div><Skeleton className="h-6 w-20 rounded-full" /></div></CardContent></Card>)}</div>
      </div>
    );
  }

  return (
              <Card
                key={investor.id}
                className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Investor Name & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      {investor.profileImage && (
                        <img src={investor.profileImage} alt={investor.fullName} className="w-8 h-8 rounded-full object-cover border border-border/50 mb-1" />
                      )}
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
                      <span className="text-xs text-muted-foreground">Agreement Proof</span>
                      {investor.agreementImage ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 text-primary border-primary/30"
                          onClick={() => setViewAgreementUrl(investor.agreementImage!)}
                        >
                          <Eye className="w-3 h-3" /> View Agreement
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No agreement</span>
                      )}
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

                  <Separator />

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold h-8"
                      onClick={() => {
                        setBalanceInvestor(investor);
                        setAddAmount("");
                        setAddNote("");
                        setBalanceProofFile(null);
                        setBalanceProofPreview("");
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Balance
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleSoftDelete(investor)}
                      title="Move to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Balance / Investment Dialog */}
      <Dialog open={!!balanceInvestor} onOpenChange={() => setBalanceInvestor(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Wallet className="w-5 h-5" /> Add Balance / Investment
            </DialogTitle>
            <DialogDescription>
              {balanceInvestor?.fullName} ke account me naya balance add karein
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Amount (PKR) *</label>
              <Input
                type="number"
                placeholder="e.g. 100000"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
            
              {addAmount && parseFloat(addAmount) > 0 && (
                <p className="text-xs text-primary font-medium mt-1">💰 {amountToUrduWords(addAmount)} Rupees</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Note / Remarks (Optional)</label>
              <Input
                placeholder="e.g. Cash payment / Bank transfer"
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
              />
            </div>

            {/* Payment Proof Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Payment Proof Image (Optional)</label>
              <div className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center hover:border-emerald-500/30 transition-colors">
                {balanceProofPreview ? (
                  <div className="space-y-2">
                    <img
                      src={balanceProofPreview}
                      alt="Payment Proof"
                      className="max-h-32 mx-auto rounded-lg object-cover border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setBalanceProofFile(null); setBalanceProofPreview(""); }}
                      className="h-7 text-xs"
                    >
                      Remove Proof
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <ImagePlus className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Slip / Receipt / Bank Screenshot upload karein</p>
                    <div className="flex gap-2 justify-center pt-1">
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBalanceProofChange}
                          className="hidden"
                        />
                        <Button type="button" variant="outline" size="sm" className="gap-1.5 h-7 text-xs" asChild>
                          <span>
                            <Upload className="w-3 h-3" />
                            Upload Proof
                          </span>
                        </Button>
                      </label>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleBalanceProofChange}
                          className="hidden"
                        />
                        <Button type="button" variant="outline" size="sm" className="gap-1.5 h-7 text-xs" asChild>
                          <span>
                            <Camera className="w-3 h-3" />
                            Camera
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceInvestor(null)}>Cancel</Button>
            <Button
              onClick={handleAddBalanceSubmit}
              disabled={balanceLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {balanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Add Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Agreement Image Dialog */}
      <Dialog open={!!viewAgreementUrl} onOpenChange={() => setViewAgreementUrl(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-[600px] p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Investor Agreement Document
            </DialogTitle>
          </DialogHeader>
          {viewAgreementUrl && (
            <div className="py-4 text-center space-y-4">
              <img
                src={viewAgreementUrl}
                alt="Agreement Document Proof"
                className="max-h-[70vh] w-auto mx-auto rounded-lg object-contain border shadow-sm"
              />
              <div className="flex justify-end gap-2">
                <a href={viewAgreementUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">Open Full Image</Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
