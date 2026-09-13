"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Smartphone,
  Calendar,
  Bell,
  LogOut,
  Sun,
  Moon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ImagePlus,
  Upload,
  Camera,
  Info,
  CreditCard,
  DollarSign,
  PieChart,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Investor, Customer, Investment, Notification as NotifType, Recovery } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { calculateWithdrawalImpact } from "@/lib/calculations";
import { toast } from "sonner";

export default function InvestorPortalPage() {
  const { appUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [investor, setInvestor] = useState<Investor | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recoveries, setRecoveries] = useState<Recovery[]>([]);
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Investment Dialog
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [investAmount, setInvestAmount] = useState("");
  const [investProof, setInvestProof] = useState<File | null>(null);
  const [investProofPreview, setInvestProofPreview] = useState("");
  const [investLoading, setInvestLoading] = useState(false);

  // Withdrawal Dialog
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Guide
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!appUser) {
      router.push("/");
      return;
    }
    loadData();
  }, [appUser, router]);

  const loadData = async () => {
    if (!appUser) return;
    try {
      // Find investor by userId
      const invSnap = await getDocs(query(collection(db, "investors"), where("userId", "==", appUser.uid)));
      if (invSnap.empty) { setLoading(false); return; }
      const inv = { id: invSnap.docs[0].id, ...invSnap.docs[0].data() } as Investor;
      setInvestor(inv);

      // Load customers on this investor's capital
      const custSnap = await getDocs(query(collection(db, "customers"), where("investorId", "==", inv.id)));
      setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer)));

      // Load investments history
      const invHistSnap = await getDocs(query(collection(db, "investments"), where("investorId", "==", inv.id), orderBy("date", "desc")));
      setInvestments(invHistSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Investment)));

      // Load recoveries
      const recSnap = await getDocs(query(collection(db, "recoveries"), where("investorId", "==", inv.id), orderBy("date", "desc")));
      setRecoveries(recSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Recovery)));

      // Load notifications
      const notifSnap = await getDocs(query(collection(db, "notifications"), where("userId", "==", appUser.uid), orderBy("createdAt", "desc")));
      setNotifications(notifSnap.docs.map((d) => ({ id: d.id, ...d.data() } as NotifType)));

      // Show guide if first time
      if (!appUser.guideSeen) {
        setShowGuide(true);
      }
    } catch (err) {
      console.error("Error loading investor data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async () => {
    if (!investAmount || !investor) return;
    setInvestLoading(true);
    try {
      let imageUrl = "";
      if (investProof) {
        const imageRef = ref(storage, `investments/${investor.id}/${Date.now()}_proof`);
        await uploadBytes(imageRef, investProof);
        imageUrl = await getDownloadURL(imageRef);
      }
      await addDoc(collection(db, "investments"), {
        investorId: investor.id,
        investorName: investor.fullName,
        amount: parseFloat(investAmount),
        type: "additional",
        imageProof: imageUrl,
        date: new Date().toISOString(),
        note: "Additional investment from portal",
      });
      // Notification for admin
      await addDoc(collection(db, "notifications"), {
        userId: "admin",
        type: "investment",
        title: "New Investment Added",
        message: `${investor.fullName} ne Rs. ${parseFloat(investAmount).toLocaleString()} ki nayi investment add ki hai.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      toast.success("Investment add ho gayi! Admin ko notify kar dia gaya hai.");
      setShowAddInvestment(false);
      setInvestAmount("");
      setInvestProof(null);
      setInvestProofPreview("");
      loadData();
    } catch (err) {
      toast.error("Investment add nahi ho saki");
    } finally {
      setInvestLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawAmount || !investor) return;
    const amount = parseFloat(withdrawAmount);
    if (amount > investor.availableBalance) {
      toast.error("Balance se zyada withdraw nahi ho sakta");
      return;
    }
    setWithdrawLoading(true);
    try {
      await addDoc(collection(db, "withdrawals"), {
        investorId: investor.id,
        investorName: investor.fullName,
        amount,
        status: "pending",
        requestedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, "notifications"), {
        userId: "admin",
        type: "withdrawal",
        title: "Withdrawal Request",
        message: `${investor.fullName} ne Rs. ${amount.toLocaleString()} withdraw karne ki request ki hai.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      toast.success("Withdrawal request bhej di gayi! Admin approve karega.");
      setShowWithdrawal(false);
      setWithdrawAmount("");
    } catch (err) {
      toast.error("Request nahi bhej saki");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const withdrawalImpact = investor && withdrawAmount
    ? calculateWithdrawalImpact(
        investor.availableBalance,
        parseFloat(withdrawAmount) || 0,
        investor.activeInstallments,
        investor.totalProfit / Math.max(1, investments.length)
      )
    : null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvestProof(file);
      const reader = new FileReader();
      reader.onloadend = () => setInvestProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Investor Portal</h1>
              <p className="text-xs text-muted-foreground">{investor?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowGuide(true)}>
              <Info className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="w-4 h-4" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => { signOut(); router.push("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Investment</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(investor?.totalInvestment || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Available Balance</p>
                  <p className={`text-xl font-bold mt-1 ${(investor?.availableBalance || 0) > 10000 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(investor?.availableBalance || 0)}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(investor?.availableBalance || 0) > 10000 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  <Wallet className={`w-5 h-5 ${(investor?.availableBalance || 0) > 10000 ? "text-green-500" : "text-red-500"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Profit</p>
                  <p className="text-xl font-bold mt-1 text-green-500">{formatCurrency(investor?.totalProfit || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Sets</p>
                  <p className="text-xl font-bold mt-1">{investor?.activeInstallments || 0}</p>
                  <p className="text-[10px] text-muted-foreground">mobiles on installment</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Dialog open={showAddInvestment} onOpenChange={setShowAddInvestment}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary"><ArrowDownToLine className="w-4 h-4" /> Add Investment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Investment</DialogTitle>
                <DialogDescription>Nayi investment amount add karein</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (PKR)</Label>
                  <Input type="number" placeholder="e.g. 100000" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Proof</Label>
                  <div className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center">
                    {investProofPreview ? (
                      <div className="space-y-2">
                        <img src={investProofPreview} alt="Proof" className="max-h-32 mx-auto rounded-lg" />
                        <Button variant="outline" size="sm" onClick={() => { setInvestProof(null); setInvestProofPreview(""); }}>Remove</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <label><input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          <Button variant="outline" size="sm" className="gap-1.5" asChild><span><Upload className="w-3.5 h-3.5" /> Upload</span></Button></label>
                        <label><input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                          <Button variant="outline" size="sm" className="gap-1.5" asChild><span><Camera className="w-3.5 h-3.5" /> Camera</span></Button></label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddInvestment} disabled={investLoading} className="gradient-primary gap-2">
                  {investLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showWithdrawal} onOpenChange={setShowWithdrawal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><ArrowUpFromLine className="w-4 h-4" /> Withdrawal Request</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdrawal Request</DialogTitle>
                <DialogDescription>Available: {formatCurrency(investor?.availableBalance || 0)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Withdrawal Amount (PKR)</Label>
                  <Input type="number" placeholder="Amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                </div>
                {withdrawalImpact && (
                  <div className={`rounded-lg p-4 text-sm space-y-2 ${withdrawalImpact.canWithdraw ? "bg-muted/50" : "bg-red-500/10"}`}>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining Balance:</span>
                      <span className={`font-bold ${withdrawalImpact.remainingBalance > 10000 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(withdrawalImpact.remainingBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Monthly Earning:</span>
                      <span className="font-medium">{formatCurrency(withdrawalImpact.expectedMonthlyEarning)}</span>
                    </div>
                    {withdrawalImpact.warningMessage && (
                      <div className="flex items-start gap-2 text-yellow-600 dark:text-yellow-400 pt-1">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-xs">{withdrawalImpact.warningMessage}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleWithdrawal} disabled={withdrawLoading || !withdrawalImpact?.canWithdraw} className="gap-2">
                  {withdrawLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customers on this investor's capital */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Customers on Your Capital
            </CardTitle>
            <CardDescription>{customers.length} total customers</CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Abhi koi customer nahi hai</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map((c) => {
                  const progress = c.sellingPrice > 0 ? Math.round((c.totalPaid / c.sellingPrice) * 100) : 0;
                  return (
                    <div key={c.id} className="p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.mobileCompany} {c.mobileModel}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={c.status === "completed" ? "success" : "outline"} className="text-[10px]">
                            {c.status === "completed" ? "Completed" : `${c.paidInstallments}/${c.installmentMonths} months`}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{formatCurrency(c.remainingAmount)} left</p>
                        </div>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                        <span>Invested: {formatCurrency(c.investmentUsed)}</span>
                        <span>Paid: {formatCurrency(c.totalPaid)}</span>
                        <span>Total: {formatCurrency(c.sellingPrice)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment History & Recent Recoveries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-primary" /> Investment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No investments yet</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {investments.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                        <div>
                          <p className="text-sm font-medium text-green-500">+ {formatCurrency(inv.amount)}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDateTime(inv.date)}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{inv.type}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Recent Recoveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recoveries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recoveries yet</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {recoveries.map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                        <div>
                          <p className="text-sm font-medium">+ {formatCurrency(rec.amount)}</p>
                          <p className="text-[10px] text-muted-foreground">{rec.customerName} &bull; #{rec.installmentNumber}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{formatDate(rec.date)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {notifications.slice(0, 20).map((n) => (
                    <div key={n.id} className={`p-3 rounded-lg border transition-all ${n.read ? "bg-transparent border-border/30" : "bg-primary/5 border-primary/20"}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground shrink-0">{formatDate(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Get Started Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Welcome to Investor Portal!</DialogTitle>
            <DialogDescription>Ye guide aapko portal samjhane ke liye hai</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-blue-500" /> Total Investment</h4>
              <p className="text-muted-foreground">Ye aapki total investment dikhata hai jo aapne abhi tak di hai. Jab bhi aap nayi investment add karenge, ye amount update hoga.</p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-green-500" /> Available Balance</h4>
              <p className="text-muted-foreground">Ye aapka current available balance hai. Jab koi mobile bechta hai aapke capital se, to ye kam hota hai. Jab installment aati hai, to ye wapas barhta hai. Green matlab acha balance, Red matlab kam balance.</p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /> Total Profit</h4>
              <p className="text-muted-foreground">Ye aapka share ka profit hai. Jab customer apni installments complete karta hai, to profit ratio ke hisab se aapko milta hai.</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><Smartphone className="w-4 h-4 text-purple-500" /> Active Sets</h4>
              <p className="text-muted-foreground">Kitne mobile phones abhi installment pe chal rahe hain aapke capital se. Ye count dikhata hai ke aapke paise kitne deals mein lage hain.</p>
            </div>
            <div className="p-4 rounded-xl bg-muted border">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><ArrowDownToLine className="w-4 h-4" /> Add Investment</h4>
              <p className="text-muted-foreground">Is button se aap nayi investment add kar sakte hain. Proof image upload karein aur amount likhen - admin ko automatic notification jayegi.</p>
            </div>
            <div className="p-4 rounded-xl bg-muted border">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><ArrowUpFromLine className="w-4 h-4" /> Withdrawal</h4>
              <p className="text-muted-foreground">Agar aap paise nikalna chahte hain, to withdrawal request bhejein. System aapko batayega ke withdrawal ke baad aapki expected earning kitni hogi.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGuide(false)} className="w-full gradient-primary">Samajh Gaya - Let&apos;s Go!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

