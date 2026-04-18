"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("aqua-graph-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return stored ? stored === "dark" : prefersDark;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  function toggleTheme() {
    const nextValue = !isDark;
    document.documentElement.classList.toggle("dark", nextValue);
    window.localStorage.setItem("aqua-graph-theme", nextValue ? "dark" : "light");
    setIsDark(nextValue);
  }

  return (
    <Button variant="outline" size="icon" className="rounded-full" onClick={toggleTheme}>
      {isDark ? <SunMedium /> : <MoonStar />}
    </Button>
  );
}
