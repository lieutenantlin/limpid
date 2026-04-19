"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPinned } from "lucide-react";

import { SampleMap } from "@/components/map/sample-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { getSampleMarkers, getVelocityForPoints } from "@/lib/api";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";

export default function MapPage() {
  const emptyFilters = {
    deviceId: "",
    from: "",
    to: "",
    minConfidence: "",
    minEstimate: "",
    maxEstimate: "",
  };

  const [inputFilters, setInputFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const markersQuery = useQuery({
    queryKey: ["map", "markers", appliedFilters],
    queryFn: () => getSampleMarkers(appliedFilters),
  });

  const velocityQuery = useQuery({
    queryKey: ["map", "velocity", markersQuery.data?.map(m => m.id) ?? []],
    queryFn: () => getVelocityForPoints(
      (markersQuery.data ?? []).map(m => ({ lat: m.lat, lng: m.lng }))
    ),
    enabled: (markersQuery.data?.length ?? 0) > 0,
    staleTime: 5 * 60 * 1000,
  });

  const markersWithVelocity = useMemo(() => {
    if (!markersQuery.data) return [];
    if (!velocityQuery.data) return markersQuery.data;
    return markersQuery.data.map((marker, i) => ({
      ...marker,
      velocity: velocityQuery.data[i] ?? undefined,
    }));
  }, [markersQuery.data, velocityQuery.data]);

  const filteredMarkers = useMemo(() => {
    return markersWithVelocity.filter((marker) => {
      const minConfidence = appliedFilters.minConfidence ? Number(appliedFilters.minConfidence) : undefined;
      const minEstimate = appliedFilters.minEstimate ? Number(appliedFilters.minEstimate) : undefined;
      const maxEstimate = appliedFilters.maxEstimate ? Number(appliedFilters.maxEstimate) : undefined;

      if (minConfidence !== undefined && marker.confidence < minConfidence) return false;
      if (minEstimate !== undefined && marker.microplasticEstimate < minEstimate) return false;
      if (maxEstimate !== undefined && marker.microplasticEstimate > maxEstimate) return false;
      return true;
    });
  }, [appliedFilters.maxEstimate, appliedFilters.minConfidence, appliedFilters.minEstimate, markersWithVelocity]);

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
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)] animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <Card className="surface rounded-[2rem] border-0 xl:sticky xl:top-4 xl:h-fit">
        <CardHeader>
          <p className="eyebrow">Map filters</p>
          <CardTitle className="mt-2 text-xl">Explore sample geography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Device ID"
            value={inputFilters.deviceId}
            onChange={(event) => setInputFilters((current) => ({ ...current, deviceId: event.target.value }))}
          />
          <Input
            type="date"
            value={inputFilters.from}
            onChange={(event) => setInputFilters((current) => ({ ...current, from: event.target.value }))}
          />
          <Input
            type="date"
            value={inputFilters.to}
            onChange={(event) => setInputFilters((current) => ({ ...current, to: event.target.value }))}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Minimum confidence (0-1)"
            value={inputFilters.minConfidence}
            onChange={(event) => setInputFilters((current) => ({ ...current, minConfidence: event.target.value }))}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Minimum estimate"
            value={inputFilters.minEstimate}
            onChange={(event) => setInputFilters((current) => ({ ...current, minEstimate: event.target.value }))}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Maximum estimate"
            value={inputFilters.maxEstimate}
            onChange={(event) => setInputFilters((current) => ({ ...current, maxEstimate: event.target.value }))}
          />
          <Button className="w-full" onClick={() => setAppliedFilters(inputFilters)}>
            Apply filters
          </Button>
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
                  className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 hover:border-primary/50 transition-colors duration-200"
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
