"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Microscope } from "lucide-react";

import { SampleMap } from "@/components/map/sample-map";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSample } from "@/lib/api";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";

export default function SampleDetailPage() {
  const params = useParams<{ id: string }>();
  const sampleQuery = useQuery({
    queryKey: ["sample", params.id],
    queryFn: () => getSample(params.id),
  });

  if (sampleQuery.isLoading) return <LoadingPanel label="Loading sample detail..." />;
  if (sampleQuery.isError || !sampleQuery.data) {
    return (
      <EmptyState
        icon={Microscope}
        title="Sample detail is unavailable"
        description="The requested sample could not be loaded. It may have been removed or the session no longer has access."
      />
    );
  }

  const sample = sampleQuery.data;
  const markers = [
    {
      id: sample.id,
      sampleId: sample.sampleId,
      lat: sample.latitude,
      lng: sample.longitude,
      capturedAt: sample.capturedAt,
      microplasticEstimate: sample.microplasticEstimate,
      confidence: sample.confidence,
      deviceId: sample.device?.deviceId ?? sample.deviceId ?? "unknown",
    },
  ];

  return (
    <div className="space-y-4">
      <Link href="/samples" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to samples
      </Link>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Sample metadata</p>
                <CardTitle className="mt-2 text-2xl">{sample.sampleId}</CardTitle>
              </div>
              <Badge variant="secondary">{formatPercent(sample.confidence)} confidence</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DetailField label="Estimate" value={`${formatNumber(sample.microplasticEstimate, 2)} ${sample.unit}`} />
            <DetailField label="Captured at" value={formatDateTime(sample.capturedAt)} />
            <DetailField label="Received at" value={formatDateTime(sample.receivedAt)} />
            <DetailField label="Device" value={sample.device?.label ?? sample.device?.deviceId ?? "Unknown"} />
            <DetailField label="Model version" value={sample.modelVersion} />
            <DetailField label="Source" value={sample.source} />
            <DetailField label="Latitude" value={sample.latitude.toFixed(6)} />
            <DetailField label="Longitude" value={sample.longitude.toFixed(6)} />
          </CardContent>
        </Card>

        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Notes and tags</p>
            <CardTitle className="mt-2 text-2xl">Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 text-sm text-muted-foreground">
              {sample.notes || "No operator notes were attached to this sample."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(sample.tags ?? []).length > 0 ? (
                sample.tags?.map((tag) => (
                  <Badge key={typeof tag === "string" ? tag : tag.tag} variant="outline">
                    {typeof tag === "string" ? tag : tag.tag}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No tags</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Image capture</p>
            <CardTitle className="mt-2 text-2xl">Microscope imagery</CardTitle>
          </CardHeader>
          <CardContent>
            {sample.imageUrl || sample.thumbnailUrl ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60">
                <Image
                  src={sample.imageUrl ?? sample.thumbnailUrl ?? ""}
                  alt={`Sample ${sample.sampleId}`}
                  width={900}
                  height={700}
                  className="h-auto w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                No image asset is currently available for this sample.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="surface rounded-[2rem] border-0">
          <CardHeader>
            <p className="eyebrow">Location panel</p>
            <CardTitle className="mt-2 text-2xl">Geographic position</CardTitle>
          </CardHeader>
          <CardContent>
            <SampleMap markers={markers} selectedId={sample.id} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 text-sm font-medium">{value}</p>
    </div>
  );
}
