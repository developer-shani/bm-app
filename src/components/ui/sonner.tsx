"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border/60 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-2xl group-[.toaster]:px-5 group-[.toaster]:py-4 group-[.toaster]:border",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          closeButton:
            "group-[.toast]:bg-muted/80 group-[.toast]:text-foreground group-[.toast]:border-border/50 group-[.toast]:rounded-full group-[.toast]:hover:bg-muted",
          success:
            "group-[.toaster]:!bg-emerald-500/15 group-[.toaster]:!border-emerald-500/40 group-[.toaster]:!text-emerald-400",
          error:
            "group-[.toaster]:!bg-red-500/15 group-[.toaster]:!border-red-500/40 group-[.toaster]:!text-red-400",
          warning:
            "group-[.toaster]:!bg-yellow-500/15 group-[.toaster]:!border-yellow-500/40 group-[.toaster]:!text-yellow-400",
          info:
            "group-[.toaster]:!bg-blue-500/15 group-[.toaster]:!border-blue-500/40 group-[.toaster]:!text-blue-400",
        },
      }}
      style={
        {
          "--toast-close-button-start": "auto",
          "--toast-close-button-end": "4px",
          "--toast-close-button-transform": "none",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
