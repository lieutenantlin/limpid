"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPinned } from "lucide-react";

import { SampleMap } from "@/components/map/sample-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { getSampleMarkers } from "@/lib/api";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";

export default function MapPage() {
  const [filters, setFilters] = useState({
    deviceId: "",
    from: "",
    to: "",
    minConfidence: "",
    minEstimate: "",
    maxEstimate: "",
  });

  const markersQuery = useQuery({
    queryKey: ["map", filters],
    queryFn: () => getSampleMarkers(filters),
  });

  const filteredMarkers = useMemo(() => {
    return (markersQuery.data ?? []).filter((marker) => {
      const minConfidence = filters.minConfidence ? Number(filters.minConfidence) : undefined;
      const minEstimate = filters.minEstimate ? Number(filters.minEstimate) : undefined;
      const maxEstimate = filters.maxEstimate ? Number(filters.maxEstimate) : undefined;

      if (minConfidence !== undefined && marker.confidence < minConfidence) return false;
      if (minEstimate !== undefined && marker.microplasticEstimate < minEstimate) return false;
      if (maxEstimate !== undefined && marker.microplasticEstimate > maxEstimate) return false;
      return true;
    });
  }, [filters.maxEstimate, filters.minConfidence, filters.minEstimate, markersQuery.data]);

  if (markersQuery.isLoading) return <LoadingPanel label="Loading map markers..." />;
  if (markersQuery.isError) {
    return (
      <EmptyState
        icon={MapPinned}
        title="Map data is unavailable"
        description="The backend did not return location records. Check sample permissions and API connectivity."
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="surface rounded-[2rem] border-0 xl:sticky xl:top-4 xl:h-fit">
        <CardHeader>
          <p className="eyebrow">Map filters</p>
          <CardTitle className="mt-2 text-xl">Explore sample geography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Device ID"
            value={filters.deviceId}
            onChange={(event) => setFilters((current) => ({ ...current, deviceId: event.target.value }))}
          />
          <Input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Minimum confidence (0-1)"
            value={filters.minConfidence}
            onChange={(event) => setFilters((current) => ({ ...current, minConfidence: event.target.value }))}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Minimum estimate"
            value={filters.minEstimate}
            onChange={(event) => setFilters((current) => ({ ...current, minEstimate: event.target.value }))}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Maximum estimate"
            value={filters.maxEstimate}
            onChange={(event) => setFilters((current) => ({ ...current, maxEstimate: event.target.value }))}
          />
          <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4">
            <p className="text-sm font-medium">{filteredMarkers.length} visible markers</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Marker payloads show sample ID, capture time, estimate, confidence, and device linkage.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Interactive map</p>
            <CardTitle className="mt-2 text-xl">Field sample distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SampleMap markers={filteredMarkers} />
          </CardContent>
        </Card>
        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Marker summaries</p>
            <CardTitle className="mt-2 text-xl">Quick access to nearby records</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {filteredMarkers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No markers match the current thresholds.</p>
            ) : (
              filteredMarkers.slice(0, 8).map((marker) => (
                <Link
                  key={marker.id}
                  href={`/samples/${marker.id}`}
                  className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{marker.sampleId}</p>
                    <Badge variant="outline">{formatPercent(marker.confidence)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(marker.capturedAt)}</p>
                  <p className="mt-4 text-sm">Estimate {formatNumber(marker.microplasticEstimate, 2)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Device {marker.deviceId}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
