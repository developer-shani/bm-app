"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, Wallet, Handshake } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, appUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email aur password dono zaruri hain");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Login me masla aya");
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  // Redirect after login based on role
  useEffect(() => {
    if (appUser) {
      if (appUser.role === "investor") {
        router.push("/investor/portal");
      } else if (appUser.role === "reseller") {
        router.push("/reseller/portal");
      } else {
        router.push("/dashboard");
      }
    }
  }, [appUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Brother <span className="gradient-text">Mobiles</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Installment Sales Manager
          </p>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-border/40">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Apna account login karein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 animate-fade-in">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="aapka@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-background/50"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password enter karein"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-background/50"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold gradient-primary hover:opacity-90 transition-opacity"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Quick Demo Logins */}
            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="text-xs text-center text-muted-foreground mb-3 font-medium">
                ⚡ Quick Demo Login (Click to test roles):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium h-9 border-primary/20 hover:bg-primary/10"
                  onClick={async () => {
                    setEmail("admin@brothermobiles.com");
                    setPassword("admin123");
                    setIsLoading(true);
                    await signIn("admin@brothermobiles.com", "admin123");
                    router.push("/dashboard");
                    setIsLoading(false);
                  }}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5 inline" /> Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium h-9 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  onClick={async () => {
                    setEmail("investor@brothermobiles.com");
                    setPassword("investor123");
                    setIsLoading(true);
                    await signIn("investor@brothermobiles.com", "investor123");
                    router.push("/investor/portal");
                    setIsLoading(false);
                  }}
                >
                  <Wallet className="w-4 h-4 mr-1.5 inline" /> Investor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium h-9 border-blue-500/20 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  onClick={async () => {
                    setEmail("reseller@brothermobiles.com");
                    setPassword("reseller123");
                    setIsLoading(true);
                    await signIn("reseller@brothermobiles.com", "reseller123");
                    router.push("/reseller/portal");
                    setIsLoading(false);
                  }}
                >
                  <Handshake className="w-4 h-4 mr-1.5 inline" /> Reseller
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Brother Mobiles &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

