"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingPanel } from "@/components/ui/loading-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSamples } from "@/lib/api";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { Sample } from "@/lib/types";

type SortKey = "capturedAt" | "microplasticEstimate" | "confidence" | "sampleId";

export default function SamplesPage() {
  const [filters, setFilters] = useState({
    deviceId: "",
    from: "",
    to: "",
    source: "",
    page: 1,
    limit: 12,
  });
  const [sortKey, setSortKey] = useState<SortKey>("capturedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const samplesQuery = useQuery({
    queryKey: ["samples", filters],
    queryFn: () => getSamples(filters),
  });

  const sortedSamples = useMemo(() => {
    const data = [...(samplesQuery.data?.data ?? [])];
    data.sort((left, right) => {
      const order = sortDirection === "asc" ? 1 : -1;
      const values: Record<SortKey, string | number> = {
        sampleId: left.sampleId.localeCompare(right.sampleId),
        capturedAt: left.capturedAt.localeCompare(right.capturedAt),
        microplasticEstimate: left.microplasticEstimate - right.microplasticEstimate,
        confidence: left.confidence - right.confidence,
      };

      if (sortKey === "sampleId" || sortKey === "capturedAt") {
        return (values[sortKey] as number) * order;
      }

      return (values[sortKey] as number) * order;
    });
    return data;
  }, [samplesQuery.data?.data, sortDirection, sortKey]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("desc");
  }

  if (samplesQuery.isLoading) return <LoadingPanel label="Loading sample records..." />;
  if (samplesQuery.isError) {
    return (
      <EmptyState
        icon={Database}
        title="Could not load samples"
        description="The sample listing request failed. Confirm the backend is running and that your credentials still have access."
      />
    );
  }

  const response = samplesQuery.data;
  if (!response || response.data.length === 0) {
    return (
      <div className="space-y-4">
        <Filters filters={filters} onChange={setFilters} />
        <EmptyState
          icon={Database}
          title="No samples match this filter set"
          description="Adjust the date or device filters to expand the result set."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Filters filters={filters} onChange={setFilters} />
      <Card className="surface rounded-[2rem] border-0">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <p className="eyebrow">Sample browser</p>
            <CardTitle className="mt-2 text-xl">Paginated sample table</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">{response.total} total records</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader label="Sample ID" onClick={() => toggleSort("sampleId")} />
                <SortableHeader label="Captured" onClick={() => toggleSort("capturedAt")} />
                <TableHead>Device</TableHead>
                <SortableHeader label="Estimate" onClick={() => toggleSort("microplasticEstimate")} />
                <SortableHeader label="Confidence" onClick={() => toggleSort("confidence")} />
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSamples.map((sample) => (
                <SampleRow key={sample.id} sample={sample} />
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {response.page} of {Math.max(1, Math.ceil(response.total / response.limit))}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                disabled={response.page === 1}
              >
                <ChevronLeft />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
                disabled={response.page * response.limit >= response.total}
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Filters({
  filters,
  onChange,
}: {
  filters: { deviceId: string; from: string; to: string; source: string; page: number; limit: number };
  onChange: React.Dispatch<
    React.SetStateAction<{ deviceId: string; from: string; to: string; source: string; page: number; limit: number }>
  >;
}) {
  return (
    <Card className="surface rounded-[2rem] border-0">
      <CardHeader>
        <p className="eyebrow">Filters</p>
        <CardTitle className="mt-2 text-xl">Refine the sample stream</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input
          placeholder="Device ID"
          value={filters.deviceId}
          onChange={(event) =>
            onChange((current) => ({ ...current, deviceId: event.target.value, page: 1 }))
          }
        />
        <Input
          type="date"
          value={filters.from}
          onChange={(event) => onChange((current) => ({ ...current, from: event.target.value, page: 1 }))}
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(event) => onChange((current) => ({ ...current, to: event.target.value, page: 1 }))}
        />
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={filters.source}
          onChange={(event) => onChange((current) => ({ ...current, source: event.target.value, page: 1 }))}
        >
          <option value="">All sources</option>
          <option value="edge">Edge</option>
          <option value="manual">Manual</option>
          <option value="imported">Imported</option>
        </select>
        <Button
          variant="outline"
          onClick={() =>
            onChange({
              deviceId: "",
              from: "",
              to: "",
              source: "",
              page: 1,
              limit: filters.limit,
            })
          }
        >
          Reset filters
        </Button>
      </CardContent>
    </Card>
  );
}

function SortableHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <TableHead>
      <button className="cursor-pointer font-medium" onClick={onClick} type="button">
        {label}
      </button>
    </TableHead>
  );
}

function SampleRow({ sample }: { sample: Sample }) {
  return (
    <TableRow className="cursor-pointer">
      <TableCell className="font-medium">
        <Link href={`/samples/${sample.id}`} className="hover:text-primary">
          {sample.sampleId}
        </Link>
      </TableCell>
      <TableCell>{formatDateTime(sample.capturedAt)}</TableCell>
      <TableCell>{sample.device?.deviceId ?? sample.device?.label ?? "Unknown"}</TableCell>
      <TableCell>{formatNumber(sample.microplasticEstimate, 2)}</TableCell>
      <TableCell>{formatPercent(sample.confidence)}</TableCell>
      <TableCell>{sample.latitude.toFixed(4)}</TableCell>
      <TableCell>{sample.longitude.toFixed(4)}</TableCell>
      <TableCell className="capitalize">{sample.source}</TableCell>
    </TableRow>
  );
}
