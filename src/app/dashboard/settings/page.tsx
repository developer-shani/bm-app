"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Building2, Upload, MessageSquare, Percent, Calendar, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("Brother Mobiles");
  const [defaultExpense, setDefaultExpense] = useState("2000");
  const [defaultCommission, setDefaultCommission] = useState("2");
  const [maxInstallments, setMaxInstallments] = useState("9");
  const [smsTemplate, setSmsTemplate] = useState(
    `Assalam o Alaikum {customerName},\n\nAapki installment #{installmentNumber}/{totalInstallments} ki payment Rs. {pendingAmount} ki due date {dueDate} hai.\n\nShukriya,\n{companyName}`
  );

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">App configurations & defaults</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Company Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Company Logo / Watermark</Label>
            <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" />
                <Button variant="outline" size="sm" className="gap-1.5" asChild><span><Upload className="w-3.5 h-3.5" /> Upload Logo</span></Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><SettingsIcon className="w-4 h-4 text-primary" /> Default Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Default Expense (PKR)</Label><Input type="number" value={defaultExpense} onChange={(e) => setDefaultExpense(e.target.value)} /></div>
            <div className="space-y-2"><Label>Default Commission (%)</Label><Input type="number" value={defaultCommission} onChange={(e) => setDefaultCommission(e.target.value)} /></div>
            <div className="space-y-2"><Label>Max Installments</Label><Input type="number" value={maxInstallments} onChange={(e) => setMaxInstallments(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> SMS Template</CardTitle>
          <CardDescription>Available variables: {"{customerName}"}, {"{pendingAmount}"}, {"{installmentNumber}"}, {"{totalInstallments}"}, {"{dueDate}"}, {"{companyName}"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)} rows={6} className="font-mono text-xs" />
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2 gradient-primary" size="lg"><Save className="w-4 h-4" /> Save Settings</Button>
    </div>
  );
}
