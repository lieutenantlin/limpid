"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { getAdminOverview, getAuditLogs, getUsers, updateUserRole } from "@/lib/api";
import { formatDateTime, formatRole } from "@/lib/format";
import type { UserRole } from "@/lib/types";

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getAdminOverview,
    enabled: user?.role === "admin",
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getUsers,
    enabled: user?.role === "admin",
  });
  const auditQuery = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: getAuditLogs,
    enabled: user?.role === "admin",
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onSettled: () => {
      setPendingUserId(null);
    },
  });

  if (user?.role !== "admin") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required"
        description="This view is only available to admin users. Researcher and viewer accounts should use the standard dashboard pages."
      />
    );
  }

  if (overviewQuery.isLoading || usersQuery.isLoading || auditQuery.isLoading) {
    return <LoadingPanel label="Loading admin controls..." />;
  }

  if (overviewQuery.isError || usersQuery.isError || auditQuery.isError || !overviewQuery.data) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin data is unavailable"
        description="One or more admin endpoints failed. Verify backend permissions and route availability."
      />
    );
  }

  const overview = overviewQuery.data;

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total users", overview.totalUsers],
          ["Admins", overview.adminUsers],
          ["Researchers", overview.researchers],
          ["Viewers", overview.viewers],
          ["Recent audit events", overview.recentAuditEvents],
        ].map(([label, value]) => (
          <Card className="surface rounded-[2rem] border-0" key={label}>
            <CardHeader>
              <p className="eyebrow">{label}</p>
              <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Role management</p>
            <CardTitle className="mt-2 text-xl">Users and permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usersQuery.data?.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-background/55 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{account.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{formatRole(account.role)}</Badge>
                  <select
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    defaultValue={account.role}
                    disabled={updateRoleMutation.isPending && pendingUserId === account.id}
                    onChange={(event) => {
                      setPendingUserId(account.id);
                      updateRoleMutation.mutate({
                        id: account.id,
                        role: event.target.value as UserRole,
                      });
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="researcher">Researcher</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Audit timeline</p>
            <CardTitle className="mt-2 text-xl">Recent administrative actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditQuery.data?.slice(0, 10).map((entry) => (
              <div key={entry.id} className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{entry.action}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {entry.entityType}:{entry.entityId}
                  </span>
                </div>
                <p className="mt-3 text-sm">
                  {entry.actorUser?.name ?? entry.actorUser?.email ?? "Unknown actor"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
