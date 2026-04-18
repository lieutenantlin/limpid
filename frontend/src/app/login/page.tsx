import { Suspense } from "react";

import { LoginPageClient } from "@/app/login/login-page-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center">Loading login...</main>}>
      <LoginPageClient />
    </Suspense>
  );
}
