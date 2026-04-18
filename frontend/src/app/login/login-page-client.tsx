"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowRight, Droplets, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPageClient() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "password123",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email, values.password);
      router.replace(searchParams.get("next") ?? "/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      setError("root", { message });
    }
  }

  return (
    <main className="grid min-h-screen gap-6 p-4 lg:grid-cols-[1.2fr_0.8fr] lg:p-6">
      <section className="surface relative overflow-hidden rounded-[2.5rem] px-6 py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/20 via-accent/25 to-transparent" />
        <div className="relative flex h-full flex-col justify-between gap-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Civic Monitoring Console</p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight lg:text-6xl">
                Trace microplastic signals across the water network.
              </h1>
            </div>
            <ThemeToggle />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Droplets,
                title: "Field to dashboard",
                description: "Review microscope captures, edge estimates, and location metadata in one place.",
              },
              {
                icon: ShieldCheck,
                title: "Role-aware controls",
                description: "Researchers and admins get distinct access to device and audit workflows.",
              },
              {
                icon: ArrowRight,
                title: "Fast triage",
                description: "Move from map to sample detail without losing context or filter state.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.75rem] border border-border/60 bg-background/65 p-4">
                <item.icon className="mb-4 size-5 text-primary" />
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center">
        <Card className="surface w-full max-w-md rounded-[2rem] border-0 py-0">
          <CardHeader className="px-6 pt-6">
            <p className="eyebrow">Authenticated access</p>
            <CardTitle className="mt-2 text-2xl font-semibold">Sign in to Aqua Graph</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input id="email" type="email" placeholder="researcher@example.org" {...register("email")} />
                {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input id="password" type="password" {...register("password")} />
                {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
              </div>
              {errors.root ? (
                <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    <span>{errors.root.message}</span>
                  </div>
                </div>
              ) : null}
              <Button className="h-10 w-full rounded-xl" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Signing in..." : "Enter dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
