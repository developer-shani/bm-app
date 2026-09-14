import os

# File 1: sonner.tsx
sonner_content = """"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/80 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:border group-[.toaster]:text-xs group-[.toaster]:font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[11px]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-semibold group-[.toast]:text-xs",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          closeButton:
            "group-[.toast]:text-foreground/70 group-[.toast]:hover:text-foreground group-[.toast]:border-0 group-[.toast]:bg-transparent",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
"""

with open("src/components/ui/sonner.tsx", "w", encoding="utf-8") as f:
    f.write(sonner_content)

print("1. sonner.tsx updated!")

