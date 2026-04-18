"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Cpu,
  Gauge,
  ListFilter,
  LogOut,
  Map,
  Menu,
  ShieldCheck,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const baseNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/map", label: "Map", icon: Map },
  { href: "/samples", label: "Samples", icon: ListFilter },
  { href: "/devices", label: "Devices", icon: Cpu },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const navigation = user?.role === "admin"
    ? [...baseNavigation, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : baseNavigation;

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const navContent = (
    <nav className="flex flex-col gap-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="surface hidden rounded-[2rem] p-5 lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="eyebrow">Field Dashboard</p>
              <h1 className="text-lg font-semibold">Aqua Graph</h1>
            </div>
          </div>
          {navContent}
          <div className="mt-auto rounded-3xl border border-border/60 bg-background/70 p-4">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-4 flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" className="flex-1" onClick={handleLogout}>
                <LogOut />
                Sign out
              </Button>
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-col gap-4">
          <header className="surface flex items-center justify-between rounded-[2rem] px-4 py-3 lg:px-6">
            <div>
              <p className="eyebrow">Microplastics Research Network</p>
              <h2 className="text-xl font-semibold">
                {navigation.find((item) => pathname.startsWith(item.href))?.label ?? "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium">{user?.role}</p>
                <p className="text-xs text-muted-foreground">Authenticated workspace</p>
              </div>
              <ThemeToggle />
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="outline" size="icon" className="lg:hidden rounded-full">
                      <Menu />
                    </Button>
                  }
                />
                <SheetContent className="surface w-[min(22rem,calc(100vw-2rem))] rounded-[2rem] border border-border/60 p-5">
                  <SheetHeader className="mb-4 px-0 pt-0">
                    <p className="eyebrow">Navigation</p>
                    <SheetTitle className="text-lg font-semibold">Aqua Graph</SheetTitle>
                  </SheetHeader>
                  {navContent}
                  <div className="mt-6">
                    <SheetClose
                      render={
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                          <LogOut />
                          Sign out
                        </Button>
                      }
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
