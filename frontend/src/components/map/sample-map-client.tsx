"use client";

import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import Link from "next/link";

import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { SampleMarker } from "@/lib/types";

function boundsForMarkers(markers: SampleMarker[]) {
  if (markers.length === 0) {
    return {
      center: [34.0522, -118.2437] as [number, number],
      zoom: 6,
    };
  }

  const averageLat = markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length;
  const averageLng = markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length;

  return { center: [averageLat, averageLng] as [number, number], zoom: 8 };
}

export default function SampleMapClient({
  markers,
  selectedId,
}: {
  markers: SampleMarker[];
  selectedId?: string;
}) {
  const { center, zoom } = useMemo(() => boundsForMarkers(markers), [markers]);

  return (
    <div className="h-[28rem] overflow-hidden rounded-[2rem] border border-border/60">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full bg-muted"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={[marker.lat, marker.lng]}
            pathOptions={{
              color: marker.id === selectedId ? "#ea580c" : "#0f766e",
              fillColor: marker.id === selectedId ? "#fb923c" : "#06b6d4",
              fillOpacity: 0.8,
            }}
            radius={marker.id === selectedId ? 12 : 8}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{marker.sampleId}</p>
                <p>{formatDateTime(marker.capturedAt)}</p>
                <p>Estimate: {formatNumber(marker.microplasticEstimate, 2)}</p>
                <p>Confidence: {formatPercent(marker.confidence)}</p>
                <p>Device: {marker.deviceId}</p>
                <Link href={`/samples/${marker.id}`} className="text-primary underline-offset-4 hover:underline">
                  View sample detail
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
