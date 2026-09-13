"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "sonner";

export default function AddResellerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    if (!fullName || !phone) { toast.error("Naam aur phone zaruri hai"); return; }
    setIsLoading(true);
    try {
      await addDoc(collection(db, "resellers"), {
        userId: "", fullName, phone, email,
        totalCommission: 0, pendingCommission: 0, totalReferrals: 0,
        status: "active", createdAt: new Date().toISOString(),
      });
      toast.success("Reseller add hogaya!");
      router.push("/dashboard/resellers");
    } catch (err: any) { toast.error(err.message || "Error"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/resellers"><Button variant="ghost" size="icon" className="rounded-lg"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div><h1 className="text-xl font-bold">Add New Reseller</h1><p className="text-sm text-muted-foreground">Create reseller/referrer account</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Reseller Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="Reseller ka naam" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone Number *</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="03XX-XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" /></div></div>
          <div className="space-y-2"><Label>Email (Optional)</Label><Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full gradient-primary gap-2" size="lg">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Add Reseller
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

