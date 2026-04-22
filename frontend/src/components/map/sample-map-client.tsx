"use client";

import "leaflet/dist/leaflet.css";
import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { SampleMarker } from "@/lib/types";

const iconCache = new Map<string, L.DivIcon>();
const maxIconCacheSize = 256;
const minZoomScale = 0.35;
const maxZoomScale = 1.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function zoomScaleFor(currentZoom: number, referenceZoom: number) {
  return clamp(2 ** (currentZoom - referenceZoom), minZoomScale, maxZoomScale);
}

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

function createVelocityArrowIcon(direction: number, speed: number, isSelected: boolean, zoomScale: number) {
  const scaleBucket = Math.round(zoomScale * 100);
  const key = `${Math.round(direction)}|${Math.round(speed * 100)}|${isSelected ? 1 : 0}|${scaleBucket}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const minLength = 16;
  const maxLength = 40;
  const normalizedSpeed = Math.min(speed / 0.5, 1);
  const length = (minLength + normalizedSpeed * (maxLength - minLength)) * zoomScale;

  const color = isSelected ? "#ea580c" : "#0f766e";
  const size = length + 20 * zoomScale;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = clamp(3 * zoomScale, 1.25, 4.5);
  const arrowHalfWidth = 5 * zoomScale;
  const arrowBaseOffset = 8 * zoomScale;
  const arrowTipOffset = 4 * zoomScale;

  // Arrow points up (North = 0°); rotating by `direction` gives the correct bearing.
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"
         style="transform: rotate(${90 - direction}deg); transform-origin: ${cx}px ${cy}px;">
      <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - length}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />
      <polygon points="${cx - arrowHalfWidth},${cy - length + arrowBaseOffset} ${cx},${cy - length - arrowTipOffset} ${cx + arrowHalfWidth},${cy - length + arrowBaseOffset}" fill="${color}" />
    </svg>
  `;

  const icon = L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [cx, cy],
  });
  iconCache.set(key, icon);
  if (iconCache.size > maxIconCacheSize) {
    const oldestKey = iconCache.keys().next().value;
    if (oldestKey) {
      iconCache.delete(oldestKey);
    }
  }
  return icon;
}

function ZoomScaleTracker({
  referenceZoom,
  onScaleChange,
}: {
  referenceZoom: number;
  onScaleChange: (scale: number) => void;
}) {
  const map = useMapEvents({
    zoomend: () => {
      onScaleChange(zoomScaleFor(map.getZoom(), referenceZoom));
    },
  });

  return null;
}

export default function SampleMapClient({
  markers,
  selectedId,
}: {
  markers: SampleMarker[];
  selectedId?: string;
}) {
  const { center, zoom } = useMemo(() => boundsForMarkers(markers), [markers]);
  const [zoomScale, setZoomScale] = useState(() => zoomScaleFor(zoom, zoom));

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
        <ZoomScaleTracker referenceZoom={zoom} onScaleChange={setZoomScale} />
        {markers.map((marker) => {
          const isSelected = marker.id === selectedId;

          if (marker.velocity) {
            return (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={createVelocityArrowIcon(marker.velocity.direction, marker.velocity.speed, isSelected, zoomScale)}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{marker.sampleId}</p>
                    <p>{formatDateTime(marker.capturedAt)}</p>
                    <p>Estimate: {formatNumber(marker.microplasticEstimate, 2)}</p>
                    <p>Confidence: {formatPercent(marker.confidence)}</p>
                    <p>Device: {marker.deviceId}</p>
                    <p>Velocity: {(marker.velocity.speed * 100).toFixed(1)} cm/s @ {marker.velocity.direction.toFixed(0)}°</p>
                    <Link href={`/samples/${marker.id}`} className="text-primary underline-offset-4 hover:underline">
                      View sample detail
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          }

          return (
            <CircleMarker
              key={marker.id}
              center={[marker.lat, marker.lng]}
              pathOptions={{
                color: isSelected ? "#ea580c" : "#0f766e",
                fillColor: isSelected ? "#fb923c" : "#06b6d4",
                fillOpacity: 0.8,
              }}
              radius={isSelected ? 12 : 8}
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
          );
        })}
      </MapContainer>
    </div>
  );
}
