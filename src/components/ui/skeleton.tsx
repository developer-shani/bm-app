import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg skeleton-glow shimmer-effect transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
