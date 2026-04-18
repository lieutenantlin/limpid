"use client";

import dynamic from "next/dynamic";

import type { SampleMarker } from "@/lib/types";

const SampleMapClient = dynamic(() => import("@/components/map/sample-map-client"), {
  ssr: false,
});

export function SampleMap({
  markers,
  selectedId,
}: {
  markers: SampleMarker[];
  selectedId?: string;
}) {
  return <SampleMapClient markers={markers} selectedId={selectedId} />;
}
