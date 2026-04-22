"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Cpu, Droplets, ScanSearch } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSampleStats, getVelocityForPoints, getSampleMarkers, getConcentrationForPoints } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, formatNumber, formatPercent, formatShortDate } from "@/lib/format";

export default function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getSampleStats,
  });

  const markersQuery = useQuery({
    queryKey: ["dashboard", "markers"],
    queryFn: () => getSampleMarkers({}),
  });

  const selectedLat = selectedLocation 
    ? markersQuery.data?.find(m => m.id === selectedLocation)?.lat ?? 33.4
    : markersQuery.data?.[0]?.lat ?? 33.4;

  const selectedLng = selectedLocation
    ? markersQuery.data?.find(m => m.id === selectedLocation)?.lng ?? -118.0
    : markersQuery.data?.[0]?.lng ?? -118.0;

  const velocityQuery = useQuery({
    queryKey: ["dashboard", "velocity", selectedLat, selectedLng],
    queryFn: () => getVelocityForPoints([{ lat: selectedLat, lng: selectedLng }]),
    enabled: !!markersQuery.data?.length,
  });

  const concentrationQuery = useQuery({
    queryKey: ["dashboard", "concentration", selectedLat, selectedLng],
    queryFn: () => getConcentrationForPoints([{ lat: selectedLat, lng: selectedLng }]),
    enabled: !!markersQuery.data?.length,
  });

  if (statsQuery.isLoading) return <LoadingPanel label="Building your research overview..." />;
  if (statsQuery.isError || !statsQuery.data) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Dashboard data is unavailable"
        description="The API did not return enough data to build the overview. Check the backend connection and your authenticated session."
      />
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Droplets}
          label="Total samples"
          value={formatNumber(stats.totalSamples, 0)}
          detail="All captured and synced sample records currently visible to your account."
        />
        <KpiCard
          icon={ScanSearch}
          label="Average estimate"
          value={`${formatNumber(stats.averageEstimate, 2)} particles`}
          detail="Mean microplastics estimate derived from the latest available dataset."
        />
        <KpiCard
          icon={BarChart3}
          label="Collected today"
          value={formatNumber(stats.todaySamples, 0)}
          detail="Samples whose `capturedAt` timestamp falls on the current UTC calendar day."
        />
        <KpiCard
          icon={Cpu}
          label="Active devices"
          value={formatNumber(stats.activeDevices, 0)}
          detail="Devices currently marked active in the backend device registry."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
<Card className="surface rounded-[2rem] border-0 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg">
          <CardHeader>
            <p className="eyebrow">Ocean Current</p>
            <Select value={selectedLocation} onValueChange={(value) => setSelectedLocation(value || "")}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Select a sample location" />
              </SelectTrigger>
              <SelectContent>
                {markersQuery.data?.map((marker) => (
                  <SelectItem key={marker.id} value={marker.id}>
                    {marker.lat.toFixed(2)}°N, {marker.lng.toFixed(2)}°W ({marker.sampleId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {(markersQuery.isLoading || velocityQuery.isLoading || concentrationQuery.isLoading) ? (
              <LoadingPanel label="Fetching current data..." />
            ) : velocityQuery.data?.[0] || concentrationQuery.data?.[0] ? (
              <div className="space-y-4">
                {concentrationQuery.data?.[0] && (
                  <div>
                    <p className="text-sm text-muted-foreground">Concentration</p>
                    <p className="text-3xl font-bold">
                      {concentrationQuery.data[0].concentrationClass}
                    </p>
                    <p className="text-lg font-normal text-muted-foreground">
                      {concentrationQuery.data[0].measurement.toFixed(5)} pieces/m³
                    </p>
                  </div>
                )}
                {velocityQuery.data?.[0] && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Speed</p>
                      <p className="text-3xl font-bold">
                        {(velocityQuery.data[0].speed * 100).toFixed(1)}
                        <span className="text-lg font-normal text-muted-foreground ml-1">
                          cm/s
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Direction</p>
                      <p className="text-3xl font-bold">
                        {velocityQuery.data[0].direction.toFixed(0)}
                        <span className="text-lg font-normal text-muted-foreground ml-1">
                         °
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Flow</p>
                      <div className="w-24 h-24 border-2 border-border rounded-full flex items-center justify-center">
                        <svg
                          width="80"
                          height="80"
                          viewBox="0 0 80 80"
                          className="text-primary"
                          style={{ transform: `rotate(${90 - velocityQuery.data[0].direction}deg)` }}
                        >
                          <line x1="40" y1="40" x2="40" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          <polygon points="34,18 40,8 46,18" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No velocity or concentration data available</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Trend chart</p>
            <CardTitle className="mt-2 text-xl">Microplastic estimate over time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend}>
                  <defs>
                    <linearGradient id="estimateFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="color-mix(in oklab, var(--border) 85%, transparent)" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "sampleCount"
                        ? [formatNumber(Number(value ?? 0), 0), "Samples"]
                        : [formatNumber(Number(value ?? 0), 2), "Avg estimate"]
                    }
                    labelFormatter={(label) => formatDateTime(`${label}T00:00:00Z`)}
                  />
                  <Area
                    type="monotone"
                    dataKey="averageEstimate"
                    stroke="var(--color-chart-1)"
                    strokeWidth={3}
                    fill="url(#estimateFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Device activity</p>
            <CardTitle className="mt-2 text-xl">Top devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No device activity has been recorded yet.</p>
            ) : (
              stats.topDevices.map((device, index) => (
                <div key={device.deviceId} className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{device.label}</p>
                      <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {device.deviceId}
                      </p>
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {device.sampleCount} samples
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Avg estimate {formatNumber(device.averageEstimate, 2)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="surface rounded-[2rem] border-0">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <p className="eyebrow">Recent captures</p>
            <CardTitle className="mt-2 text-xl">Latest sample records</CardTitle>
          </div>
          <Link href="/samples" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Browse all samples
          </Link>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {stats.recentSamples.map((sample) => (
            <Link
              key={sample.id}
              href={`/samples/${sample.id}`}
              className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 hover:border-primary/50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{sample.sampleId}</p>
                <Badge variant="outline">{formatPercent(sample.confidence)}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(sample.capturedAt)}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>{sample.device?.label ?? sample.device?.deviceId ?? "Unknown device"}</span>
                <span className="font-semibold">{formatNumber(sample.microplasticEstimate, 2)}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
