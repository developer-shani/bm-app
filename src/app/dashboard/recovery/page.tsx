"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  Search,
  Upload,
  Camera,
  Loader2,
  CheckCircle2,
  User,
  Smartphone,
  Calendar,
  Wallet,
  Trash2,
  AlertTriangle,
  Clock,
  History,
  MessageSquare,
  DollarSign,
  PlusCircle,
  FileText,
} from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Customer, Investor } from "@/types";
import { amountToUrduWords } from "@/lib/amount-words";
import { formatCurrency, formatDate, getDaysOverdue, getInstallmentStatus, cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecoveryRecord {
  id?: string;
  customerId: string;
  customerName: string;
  customerIdNumber: string;
  amount: number;
  paymentMethod?: string;
  installmentNumber: number;
  investorId: string;
  investorName: string;
  imageProof?: string;
  date: string;
  collectedBy: string;
  notes?: string;
}

export default function RecoveryPage() {
  const [activeTab, setActiveTab] = useState<"add" | "history">("add");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "due-soon">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [recoveryAmount, setRecoveryAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRecorded, setLastRecorded] = useState<{
    customer: Customer;
    amount: number;
    installmentNo: number;
  } | null>(null);

  useEffect(() => {
    // 1. Realtime Customers Listener
    const qCust = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsubCust = onSnapshot(qCust, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(data);
      setLoadingData(false);
    }, (err) => console.warn("Recovery cust sync warn:", err));

    // 2. Realtime Investors Listener
    const qInv = collection(db, "investors");
    const unsubInv = onSnapshot(qInv, (snap) => {
      setInvestors(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Investor)));
    }, (err) => console.warn("Recovery inv sync warn:", err));

    // 3. Realtime Recoveries Listener
    const qRec = query(collection(db, "recoveries"), orderBy("date", "desc"));
    const unsubRec = onSnapshot(qRec, (snap) => {
      setRecoveryHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecoveryRecord)));
    }, (err) => console.warn("Recovery rec sync warn:", err));

    return () => {
      unsubCust();
      unsubInv();
      unsubRec();
    };
  }, []);

  // Filter active customers for recovery selection
  const activeCustomers = customers.filter((c) => c.status === "active");

  const displayedCustomers = activeCustomers.filter((c) => {
    const status = getInstallmentStatus(c.nextDueDate);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "overdue" && status === "overdue") ||
      (statusFilter === "due-soon" && status === "due-soon");

    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.idNumber?.includes(searchQuery) ||
      c.phone1.includes(searchQuery) ||
      c.mobileModel.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setRecoveryAmount(customer.monthlyInstallment.toString());
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !recoveryAmount || parseFloat(recoveryAmount) <= 0) {
      toast.error("Customer select karein aur valid amount enter karein");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = "";
      if (proofImage) {
        try {
          const imageRef = ref(storage, `recoveries/${selectedCustomer.id}/${Date.now()}_proof`);
          await uploadBytes(imageRef, proofImage);
          imageUrl = await getDownloadURL(imageRef);
        } catch (imgErr) {
          console.warn("Storage upload error:", imgErr);
        }
      }

      const amount = parseFloat(recoveryAmount);
      const newTotalPaid = selectedCustomer.totalPaid + amount;
      const newRemaining = selectedCustomer.sellingPrice - newTotalPaid;
      const newPaidInstallments = selectedCustomer.paidInstallments + 1;
      const isComplete = newRemaining <= 0;

      // Add recovery record to Firestore
      const recDoc = await addDoc(collection(db, "recoveries"), {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerIdNumber: selectedCustomer.idNumber || "",
        amount,
        paymentMethod,
        installmentNumber: newPaidInstallments,
        investorId: selectedCustomer.investorId,
        investorName: selectedCustomer.investorName,
        imageProof: imageUrl,
        notes: notes || "",
        date: new Date().toISOString(),
        collectedBy: "Admin",
      });

      // Update customer record
      const nextDueDate = isComplete
        ? selectedCustomer.nextDueDate
        : new Date(
            new Date(selectedCustomer.nextDueDate).setMonth(
              new Date(selectedCustomer.nextDueDate).getMonth() + 1
            )
          ).toISOString();

      await updateDoc(doc(db, "customers", selectedCustomer.id), {
        totalPaid: newTotalPaid,
        remainingAmount: Math.max(0, newRemaining),
        paidInstallments: newPaidInstallments,
        nextDueDate,
        status: isComplete ? "completed" : "active",
      });

      // Update investor balance
      const investor = investors.find((i) => i.id === selectedCustomer.investorId);
      if (investor) {
        await updateDoc(doc(db, "investors", selectedCustomer.investorId), {
          availableBalance: (investor.availableBalance || 0) + amount,
          activeInstallments: isComplete
            ? Math.max(0, (investor.activeInstallments || 1) - 1)
            : investor.activeInstallments,
        });
      }

      setLastRecorded({
        customer: selectedCustomer,
        amount,
        installmentNo: newPaidInstallments,
      });

      toast.success(`Recovery of ${formatCurrency(amount)} recorded for ${selectedCustomer.name}!`);
      loadAllData();
    } catch (err: any) {
      console.error("Recovery record error:", err);
      toast.error(err.message || "Recovery record nahi ho saki");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setRecoveryAmount("");
    setNotes("");
    setProofImage(null);
    setProofPreview("");
    setSearchQuery("");
    setLastRecorded(null);
  };

  const handleSendWhatsAppReceipt = () => {
    if (!lastRecorded) return;
    const { customer, amount, installmentNo } = lastRecorded;
    const msg = `*Brother Mobiles - Payment Receipt* ðŸ§¾\n\nDear ${customer.name},\nWe have received your installment payment of *${formatCurrency(amount)}* (${paymentMethod}).\n\n- Installment #: ${installmentNo}/${customer.installmentMonths}\n- Remaining Balance: ${formatCurrency(Math.max(0, customer.remainingAmount - amount))}\n- Date: ${new Date().toLocaleDateString("en-PK")}\n\nThank you for choosing Brother Mobiles! ðŸ™`;
    const phone = customer.phone1.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/92${phone.startsWith("0") ? phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Calculated Stats
  const totalRecoveredAllTime = recoveryHistory.reduce((sum, r) => sum + r.amount, 0);
  const totalOverdueCount = activeCustomers.filter((c) => getInstallmentStatus(c.nextDueDate) === "overdue").length;
  const totalDueSoonCount = activeCustomers.filter((c) => getInstallmentStatus(c.nextDueDate) === "due-soon").length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Top Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Installment Recovery Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record installment collections & view payment history
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex bg-muted/60 p-1 rounded-xl border border-border/50 self-start md:self-auto">
          <Button
            variant={activeTab === "add" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("add")}
            className="gap-2 text-xs font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Recovery
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("history")}
            className="gap-2 text-xs font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            Recovery Logs ({recoveryHistory.length})
          </Button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-all border-red-500/20 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Overdue Installments</p>
              <p className="text-xl font-bold text-red-500">{totalOverdueCount} Customers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Due Within 3 Days</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{totalDueSoonCount} Customers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Collected</p>
              <p className="text-xl font-bold text-emerald-500">{formatCurrency(totalRecoveredAllTime)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TAB 1: ADD RECOVERY */}
      {activeTab === "add" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Customer Selection Column */}
          <div className="lg:col-span-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Select Customer for Recovery
                </CardTitle>
                <CardDescription>Click any customer from list or search</CardDescription>

                {/* Filters & Search */}
                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customer name, ID #, phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                      className="text-[11px] h-7 px-2.5"
                    >
                      All Active ({activeCustomers.length})
                    </Button>
                    <Button
                      variant={statusFilter === "overdue" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("overdue")}
                      className="text-[11px] h-7 px-2.5"
                    >
                      Overdue ({totalOverdueCount})
                    </Button>
                    <Button
                      variant={statusFilter === "due-soon" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("due-soon")}
                      className="text-[11px] h-7 px-2.5"
                    >
                      Due Soon ({totalDueSoonCount})
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 max-h-[460px] overflow-y-auto pr-2">
                {loadingData ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading active customers...</div>
                ) : displayedCustomers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Koi matching active customer nahi mila.
                  </div>
                ) : (
                  displayedCustomers.map((c) => {
                    const status = getInstallmentStatus(c.nextDueDate);
                    const daysOverdue = getDaysOverdue(c.nextDueDate);
                    const isSelected = selectedCustomer?.id === c.id;
  return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/60 hover:border-primary/40 hover:bg-accent/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm">{c.name}</p>
                              <Badge variant="outline" className="text-[10px]">
                                #{c.idNumber || "N/A"}
                              </Badge>
                              {status === "overdue" && (
                                <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                                  {daysOverdue}d Overdue
                                </Badge>
                              )}
                              {status === "due-soon" && (
                                <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                                  Due Soon
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.mobileCompany} {c.mobileModel} &bull; {c.phone1}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-bold text-primary">{formatCurrency(c.remainingAmount)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Inst: {formatCurrency(c.monthlyInstallment)}/mo
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-6">
            {lastRecorded ? (
              <Card className="border-green-500/30 bg-green-500/5 animate-scale-in">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto text-green-500">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Recovery Successful!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Received <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(lastRecorded.amount)}</span> from {lastRecorded.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Installment #{lastRecorded.installmentNo} of {lastRecorded.customer.installmentMonths} Recorded
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button onClick={handleSendWhatsAppReceipt} className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Send Receipt via WhatsApp
                    </Button>
                    <Button onClick={resetForm} variant="outline" className="flex-1">
                      Next Recovery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedCustomer ? (
              <Card className="animate-fade-in border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Record Recovery Details
                  </CardTitle>
                  <CardDescription>
                    Selected: <span className="font-bold text-foreground">{selectedCustomer.name}</span> (#{selectedCustomer.idNumber})
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Customer Quick Summary */}
                  <div className="bg-muted/50 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="font-medium">{selectedCustomer.mobileCompany} {selectedCustomer.mobileModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investor:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{selectedCustomer.investorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Installment:</span>
                      <span className="font-bold text-foreground">{formatCurrency(selectedCustomer.monthlyInstallment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Remaining:</span>
                      <span className="font-bold text-primary">{formatCurrency(selectedCustomer.remainingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Installment Progress:</span>
                      <span className="font-medium">{selectedCustomer.paidInstallments} / {selectedCustomer.installmentMonths} Paid</span>
                    </div>
                    <Progress value={(selectedCustomer.totalPaid / selectedCustomer.sellingPrice) * 100} className="h-1.5 mt-1" />
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Recovery Amount (PKR) *</Label>
                    <Input
                      type="number"
                      placeholder={`Standard Monthly: ${selectedCustomer.monthlyInstallment}`}
                      value={recoveryAmount}
                      onChange={(e) => setRecoveryAmount(e.target.value)}
                      className="font-bold text-sm"
                    />
                  
              {recoveryAmount && parseFloat(recoveryAmount) > 0 && (
                <p className="text-xs text-primary font-medium mt-1">💰 {amountToUrduWords(recoveryAmount)} Rupees</p>
              )}
            </div>

                  {/* Payment Method */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Payment Method</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["Cash", "Bank", "EasyPaisa", "JazzCash"].map((method) => (
                        <Button key={method}
                          type="button"
                          variant={paymentMethod === method ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaymentMethod(method)}
                          className="text-xs h-8"
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Notes / Remarks (Optional)</Label>
                    <Input
                      placeholder="e.g. Received cash at shop..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  {/* Proof Image Upload */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Payment Receipt / Slip Proof</Label>
                    <div className="border border-dashed border-border rounded-xl p-3 text-center bg-card/50 hover:bg-accent/20 transition-colors">
                      {proofPreview ? (
                        <div className="flex items-center justify-between gap-3">
                          <img src={proofPreview} alt="Receipt Proof" className="w-12 h-12 rounded-lg object-cover border" />
                          <span className="text-xs text-muted-foreground truncate">{proofImage?.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setProofImage(null); setProofPreview(""); }}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                              <Upload className="w-3.5 h-3.5" /> Upload File
                            </span>
                          </label>
                          <span className="text-xs text-muted-foreground">&bull;</span>
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                            <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                              <Camera className="w-3.5 h-3.5" /> Camera
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full gradient-primary gap-2 h-11 font-semibold text-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Recording Recovery...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Save Recovery ({formatCurrency(parseFloat(recoveryAmount) || 0)})
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 flex items-center justify-center h-full min-h-[300px]">
                <CardContent className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold">No Customer Selected</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Baayein taraf se kisi active customer par click karein recovery record karne ke liye.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECOVERY HISTORY LOGS */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Recorded Recoveries Log
            </CardTitle>
            <CardDescription>
              Saari vasooli ka mukammal record ({recoveryHistory.length} Total Records)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recoveryHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium">Abhi tak koi recovery record nahi hui.</p>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("add")}>
                  Record First Recovery
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recoveryHistory.map((rec) => (
                  <div
                    key={rec.id || Math.random().toString()}
                    className="p-4 rounded-xl border border-border/60 hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{rec.customerName}</p>
                          <Badge variant="outline" className="text-[10px]">
                            #{rec.customerIdNumber}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            Inst #{rec.installmentNumber}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Investor: {rec.investorName} &bull; Date: {formatDate(rec.date)} &bull; Method: {rec.paymentMethod || "Cash"}
                        </p>
                        {rec.notes && (
                          <p className="text-xs italic text-muted-foreground mt-1">&quot;{rec.notes}&quot;</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(rec.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Collected by {rec.collectedBy}</p>
                      </div>

                      {rec.imageProof && (
                        <a href={rec.imageProof} target="_blank" rel="noopener noreferrer">
                          <img
                            src={rec.imageProof}
                            alt="Receipt"
                            className="w-10 h-10 rounded-lg object-cover border hover:scale-105 transition-transform"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

