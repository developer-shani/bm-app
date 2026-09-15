"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  Ban,
  Calendar,
  Smartphone,
  User,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Wallet,
  Building2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { Customer } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function LossesPage() {
  const [losses, setLosses] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Recovery Modal State
  const [selectedLoss, setSelectedLoss] = useState<Customer | null>(null);
  const [recoverAmount, setRecoverAmount] = useState("");
  const [recoverMethod, setRecoverMethod] = useState("Cash");
  const [recoverNotes, setRecoverNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadLosses();
  }, []);

  const loadLosses = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "customers"), where("status", "==", "defaulted")));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
      setLosses(list);
    } catch (err) {
      console.error("Error loading losses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecover = (loss: Customer) => {
    setSelectedLoss(loss);
    setRecoverAmount(loss.remainingAmount.toString());
    setRecoverMethod("Cash");
    setRecoverNotes("Customer default resolved / amount recovered");
  };

  const handleConfirmRecovery = async () => {
    if (!selectedLoss || !recoverAmount) {
      toast.error("Recovery amount zaroori hai");
      return;
    }
    const recAmt = parseFloat(recoverAmount);
    if (isNaN(recAmt) || recAmt <= 0) {
      toast.error("Valid recovery amount likhein");
      return;
    }

    setIsSubmitting(true);
    try {
      const newTotalPaid = (selectedLoss.totalPaid || 0) + recAmt;
      const newRemaining = Math.max(0, (selectedLoss.remainingAmount || 0) - recAmt);
      const newStatus = newRemaining === 0 ? "paid" : "active";

      const newPayment = {
        id: "rec-" + Date.now(),
        amount: recAmt,
        date: new Date().toISOString(),
        installmentNo: (selectedLoss.paidInstallments || 0) + 1,
        type: "recovery",
        paymentMethod: recoverMethod,
        notes: recoverNotes,
      };

      const existingPayments = selectedLoss.payments || [];
      const updatedPayments = [...existingPayments, newPayment];

      // Update Customer Doc
      await updateDoc(doc(db, "customers", selectedLoss.id), {
        totalPaid: newTotalPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        payments: updatedPayments,
        paidInstallments: (selectedLoss.paidInstallments || 0) + (newRemaining === 0 ? 1 : 0),
        recoveredAt: new Date().toISOString(),
      });

      // Restore Partner/Investor balance & profit share if investorId exists
      if (selectedLoss.investorId) {
        const partnerRecoverShare = Math.round(recAmt * 0.5);
        try {
          const invRef = doc(db, "investors", selectedLoss.investorId);
          const invSnap = await getDoc(invRef);
          if (invSnap.exists()) {
            const invData = invSnap.data();
            await updateDoc(invRef, {
              availableBalance: (invData.availableBalance || 0) + partnerRecoverShare,
              totalProfit: (invData.totalProfit || 0) + partnerRecoverShare,
            });
          }
        } catch (invErr) {
          console.warn("Investor balance restore warning:", invErr);
        }
      }

      toast.success(`Loss Rs ${recAmt.toLocaleString()} successfully recover ho gaya! Customer status updated to ${newStatus}.`);
      setSelectedLoss(null);
      await loadLosses();
    } catch (err: any) {
      toast.error(err.message || "Recovery process me error aya");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = losses.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.mobileModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.investorName && l.investorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalLoss = losses.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
  const shopTotalLossShare = Math.round(totalLoss * 0.5);
  const partnerTotalLossShare = totalLoss - shopTotalLossShare;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Loss Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{losses.length} defaulted cases (50/50 Profit & Loss Sharing)</p>
        </div>

        {totalLoss > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Card className="border-red-500/20 bg-red-500/5 px-4 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Defaulted Loss</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(totalLoss)}</p>
            </Card>
            <Card className="border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Shop Share (50%)</p>
              <p className="text-sm font-bold text-amber-500">{formatCurrency(shopTotalLossShare)}</p>
            </Card>
            <Card className="border-purple-500/20 bg-purple-500/5 px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Partner Share (50%)</p>
              <p className="text-sm font-bold text-purple-500">{formatCurrency(partnerTotalLossShare)}</p>
            </Card>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name, phone, model or partner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Losses List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Active Losses</h3>
            <p className="text-sm text-muted-foreground">Alhamdulillah! Abhi koi defaulted loss nahi hai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((loss) => {
            const shopShare = Math.round(loss.remainingAmount * 0.5);
            const partnerShare = loss.remainingAmount - shopShare;

            return (
              <Card key={loss.id} className="border-red-500/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base">{loss.name}</h3>
                        <Badge variant="destructive" className="text-[10px] gap-1 px-2 py-0.5">
                          <Ban className="w-3 h-3" /> Defaulted
                        </Badge>
                        <span className="text-xs text-muted-foreground">({loss.phone1})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Smartphone className="w-3.5 h-3.5 text-primary" /> {loss.mobileCompany} {loss.mobileModel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {formatDate(loss.lossDate || loss.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-purple-400 font-medium">
                          <User className="w-3.5 h-3.5" /> Partner: {loss.investorName || "N/A"}
                        </span>
                      </div>

                      {loss.lossReason && (
                        <p className="text-xs bg-red-500/5 rounded-lg p-2.5 border border-red-500/15 text-red-300">
                          <strong>Reason:</strong> {loss.lossReason}
                        </p>
                      )}
                    </div>

                    <div className="text-left md:text-right space-y-1">
                      <p className="text-xl font-extrabold text-red-500">{formatCurrency(loss.remainingAmount)}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Total Loss Amount</p>
                      <div className="text-[11px] text-muted-foreground">
                        <p>Paid: {formatCurrency(loss.totalPaid)}</p>
                        <p>Selling Price: {formatCurrency(loss.sellingPrice)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 50/50 Loss Split & Recover Action */}
                  <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-muted-foreground">Shop Share (50%):</span>
                        <span className="font-bold text-amber-500">{formatCurrency(shopShare)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs">
                        <Wallet className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-muted-foreground">Partner Share (50%):</span>
                        <span className="font-bold text-purple-400">{formatCurrency(partnerShare)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleOpenRecover(loss)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold px-4 shadow-md shadow-emerald-600/20 w-full sm:w-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Recover Loss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recover Loss Dialog */}
      <Dialog open={!!selectedLoss} onOpenChange={(open) => !open && setSelectedLoss(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500">
              <RotateCcw className="w-5 h-5" /> Recover Defaulted Loss
            </DialogTitle>
            <DialogDescription>
              {selectedLoss?.name} ({selectedLoss?.mobileCompany} {selectedLoss?.mobileModel}) ka loss recover karein:
            </DialogDescription>
          </DialogHeader>

          {selectedLoss && (
            <div className="space-y-4 my-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Defaulted Loss:</span>
                  <span className="font-bold text-red-500">{formatCurrency(selectedLoss.remainingAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Partner 50% Share ({selectedLoss.investorName}):</span>
                  <span className="font-semibold text-purple-400">{formatCurrency(Math.round(selectedLoss.remainingAmount * 0.5))}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Recovered Amount (PKR) *</Label>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={recoverAmount}
                  onChange={(e) => setRecoverAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Payment Method</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["Cash", "Bank", "EasyPaisa", "JazzCash"].map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={recoverMethod === method ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecoverMethod(method)}
                      className="text-xs h-8"
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Recovery Remarks / Notes</Label>
                <Input
                  placeholder="e.g. Customer paid cash amount to resolve default"
                  value={recoverNotes}
                  onChange={(e) => setRecoverNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedLoss(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRecovery}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirm Loss Recovery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
