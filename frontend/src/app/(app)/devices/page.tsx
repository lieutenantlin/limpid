"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPanel } from "@/components/ui/loading-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDevices } from "@/lib/api";
import { formatDateTime, formatStatus } from "@/lib/format";

export default function DevicesPage() {
  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
  });

  if (devicesQuery.isLoading) return <LoadingPanel label="Loading devices..." />;
  if (devicesQuery.isError) {
    return (
      <EmptyState
        icon={Cpu}
        title="Could not load devices"
        description="The device registry request failed. The account may not have researcher or admin access."
      />
    );
  }

  if (!devicesQuery.data || devicesQuery.data.length === 0) {
    return (
      <EmptyState
        icon={Cpu}
        title="No devices have checked in"
        description="When field units report in, they will appear here with their status and version metadata."
      />
    );
  }

  return (
    <Card className="surface rounded-[2rem] border-0">
      <CardHeader>
        <p className="eyebrow">Fleet overview</p>
        <CardTitle className="mt-2 text-xl">Device registry</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead>Firmware</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devicesQuery.data.map((device) => (
              <TableRow key={device.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{device.label}</p>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {device.deviceId}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={device.status === "active" ? "default" : "outline"}>
                    {formatStatus(device.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(device.lastSeenAt)}</TableCell>
                <TableCell>{device.firmwareVersion ?? "Unknown"}</TableCell>
                <TableCell>{device.modelVersion ?? "Unknown"}</TableCell>
                <TableCell>
                  <Link href={`/devices/${device.id}`} className="text-primary underline-offset-4 hover:underline">
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
