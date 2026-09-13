"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Business performance insights</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Reports Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            Jaise sales data aayega, yahan charts aur analytics dikhenge
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
