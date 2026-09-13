import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4 text-center">
      <h1 className="text-4xl font-bold font-heading text-primary">404</h1>
      <p className="text-muted-foreground text-sm">Ye page nahi mila.</p>
      <Link href="/dashboard">
        <Button>Dashboard Pe Wapas Jayein</Button>
      </Link>
    </div>
  );
}
