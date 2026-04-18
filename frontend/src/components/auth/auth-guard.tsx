"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, pathname, router, token]);

  if (!token || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface rounded-3xl px-6 py-5 text-center">
          <p className="eyebrow mb-2">Access check</p>
          <p className="text-sm text-muted-foreground">
            Loading your dashboard session...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
