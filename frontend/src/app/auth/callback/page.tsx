"use client";

import { useEffect, useState } from "react";
import { completeCognitoLogin } from "@/lib/auth";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const target = await completeCognitoLogin(window.location.search);
        window.location.replace(target);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Unable to complete sign-in.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="surface w-full max-w-md rounded-[2rem] px-6 py-8 text-center">
        <p className="eyebrow">AWS Authentication</p>
        <h1 className="mt-3 text-2xl font-semibold">Completing sign-in</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error ?? "Finishing the Cognito redirect and restoring your dashboard session."}
        </p>
      </div>
    </main>
  );
}
