"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startLoader = useCallback(() => {
    setLoading(true);
    setProgress(35);
  }, []);

  const finishLoader = useCallback(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) {
      finishLoader();
    }
  }, [pathname, searchParams, finishLoader]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      if (!target) return;
      const href = target.getAttribute("href");
      if (href && href.startsWith("/") && href !== window.location.pathname) {
        startLoader();
      }
    };

    const attachListeners = () => {
      const anchors = document.querySelectorAll("a[href^='/']");
      anchors.forEach((a) => {
        a.addEventListener("click", handleAnchorClick as EventListener);
      });
    };

    attachListeners();
    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const anchors = document.querySelectorAll("a[href^='/']");
      anchors.forEach((a) => {
        a.removeEventListener("click", handleAnchorClick as EventListener);
      });
    };
  }, [startLoader]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && progress < 85) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          return prev + Math.floor(Math.random() * 8) + 4;
        });
      }, 120);
    }
    return () => clearInterval(interval);
  }, [loading, progress]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
      <div
        className="h-[3.5px] bg-gradient-to-r from-blue-500 via-indigo-500 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(59,130,246,0.9),0_0_6px_rgba(99,102,241,0.7)] transition-all duration-300 ease-out rounded-r-full"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
