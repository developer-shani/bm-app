import { Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-6 animate-page">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Smartphone className="w-6 h-6 text-primary absolute animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-heading font-bold text-lg text-foreground tracking-wide">Brother Mobiles</h3>
        <p className="text-xs text-muted-foreground animate-pulse">Data load ho raha hai...</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  );
}
