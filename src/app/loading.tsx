import { Smartphone, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-8 animate-page relative overflow-hidden">
      {/* Ambient Glow Background */}
      <div className="absolute w-[350px] h-[350px] rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10" />

      {/* Dual Ring Animated Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border-[3px] border-primary/20 loading-spinner-ring shadow-[0_0_25px_rgba(59,130,246,0.3)]" />
        <div className="w-14 h-14 rounded-full border-[2.5px] border-indigo-500/20 border-t-indigo-500 animate-spin absolute" />
        <div className="w-10 h-10 rounded-full bg-primary/10 backdrop-blur-md flex items-center justify-center absolute border border-primary/30">
          <Smartphone className="w-5 h-5 text-primary animate-pulse" />
        </div>
      </div>

      {/* Title & Live Status */}
      <div className="text-center space-y-2 max-w-xs">
        <div className="flex items-center justify-center gap-2">
          <h3 className="font-heading font-extrabold text-xl text-foreground tracking-wide gradient-text">
            Brother Mobiles
          </h3>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
          <RefreshCw className="w-3 h-3 animate-spin text-primary" />
          <span>System loading ho raha hai...</span>
        </div>
      </div>

      {/* Shimmer Placeholder Preview */}
      <div className="w-full max-w-md space-y-3 p-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xl pulse-card-glow">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
