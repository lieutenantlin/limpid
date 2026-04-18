"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStoredToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getStoredToken() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
        Launching dashboard...
      </div>
    </main>
  );
}
