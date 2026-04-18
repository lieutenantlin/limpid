"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Cpu } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { getDevice, getDeviceSamples } from "@/lib/api";
import { formatDateTime, formatNumber, formatPercent, formatShortDate, formatStatus } from "@/lib/format";

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const deviceQuery = useQuery({
    queryKey: ["device", params.id],
    queryFn: () => getDevice(params.id),
  });
  const samplesQuery = useQuery({
    queryKey: ["device", params.id, "samples"],
    queryFn: () => getDeviceSamples(params.id),
  });

  if (deviceQuery.isLoading || samplesQuery.isLoading) {
    return <LoadingPanel label="Loading device profile..." />;
  }

  if (deviceQuery.isError || !deviceQuery.data) {
    return (
      <EmptyState
        icon={Cpu}
        title="Device detail is unavailable"
        description="The selected device was not returned by the backend."
      />
    );
  }

  const device = deviceQuery.data;
  const samples = samplesQuery.data ?? [];
  const trend = samples
    .map((sample) => ({
      date: sample.capturedAt.slice(0, 10),
      estimate: sample.microplasticEstimate,
    }))
    .slice(0, 12)
    .reverse();

  return (
    <div className="space-y-4">
      <Link href="/devices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to devices
      </Link>
      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Device profile</p>
                <CardTitle className="mt-2 text-2xl">{device.label}</CardTitle>
              </div>
              <Badge variant={device.status === "active" ? "default" : "outline"}>
                {formatStatus(device.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DeviceField label="Device ID" value={device.deviceId} />
            <DeviceField label="Last seen" value={formatDateTime(device.lastSeenAt)} />
            <DeviceField label="Firmware" value={device.firmwareVersion ?? "Unknown"} />
            <DeviceField label="Model version" value={device.modelVersion ?? "Unknown"} />
            <DeviceField label="Samples returned" value={String(samples.length)} />
            <DeviceField label="Created at" value={formatDateTime(device.createdAt)} />
          </CardContent>
        </Card>

        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Per-device trend</p>
            <CardTitle className="mt-2 text-2xl">Recent estimate trajectory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid vertical={false} stroke="color-mix(in oklab, var(--border) 85%, transparent)" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => [formatNumber(Number(value ?? 0), 2), "Estimate"]}
                    labelFormatter={(label) => formatDateTime(`${label}T00:00:00Z`)}
                  />
                  <Line dataKey="estimate" type="monotone" stroke="var(--color-chart-2)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="surface rounded-[2rem] border-0">
        <CardHeader>
          <p className="eyebrow">Recent samples</p>
          <CardTitle className="mt-2 text-2xl">Latest records from this device</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {samples.length === 0 ? (
            <p className="text-sm text-muted-foreground">No samples are currently associated with this device.</p>
          ) : (
            samples.slice(0, 6).map((sample) => (
              <Link
                href={`/samples/${sample.id}`}
                key={sample.id}
                className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{sample.sampleId}</p>
                  <Badge variant="outline">{formatPercent(sample.confidence)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(sample.capturedAt)}</p>
                <p className="mt-4 text-sm">Estimate {formatNumber(sample.microplasticEstimate, 2)}</p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DeviceField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 text-sm font-medium">{value}</p>
    </div>
  );
}
