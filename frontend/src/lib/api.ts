"use client";

import { clearStoredToken, getStoredToken } from "@/lib/auth";
import type {
  AdminOverview,
  AuditLog,
  Device,
  Sample,
  SampleMarker,
  SampleStats,
  SamplesResponse,
  User,
  UserRole,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearStoredToken();
    throw new ApiError(401, "Your session has expired.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new ApiError(response.status, body?.error ?? "Request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function groupTrend(samples: Sample[]): SampleStats["trend"] {
  const grouped = new Map<string, { total: number; count: number }>();

  for (const sample of samples) {
    const date = sample.capturedAt.slice(0, 10);
    const current = grouped.get(date) ?? { total: 0, count: 0 };
    current.total += sample.microplasticEstimate;
    current.count += 1;
    grouped.set(date, current);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-10)
    .map(([date, value]) => ({
      date,
      sampleCount: value.count,
      averageEstimate: value.total / value.count,
    }));
}

function deriveStats(samples: Sample[], devices: Device[]): SampleStats {
  const today = new Date().toISOString().slice(0, 10);
  const averageEstimate =
    samples.reduce((sum, sample) => sum + sample.microplasticEstimate, 0) /
    Math.max(samples.length, 1);

  const topDevicesMap = new Map<
    string,
    { label: string; sampleCount: number; estimateTotal: number }
  >();

  for (const sample of samples) {
    const key = sample.device?.deviceId ?? sample.deviceId ?? "unknown";
    const current = topDevicesMap.get(key) ?? {
      label: sample.device?.label ?? key,
      sampleCount: 0,
      estimateTotal: 0,
    };
    current.sampleCount += 1;
    current.estimateTotal += sample.microplasticEstimate;
    topDevicesMap.set(key, current);
  }

  return {
    totalSamples: samples.length,
    averageEstimate,
    todaySamples: samples.filter((sample) => sample.capturedAt.startsWith(today))
      .length,
    activeDevices: devices.filter((device) => device.status === "active").length,
    trend: groupTrend(samples),
    topDevices: [...topDevicesMap.entries()]
      .map(([deviceId, value]) => ({
        deviceId,
        label: value.label,
        sampleCount: value.sampleCount,
        averageEstimate: value.estimateTotal / value.sampleCount,
      }))
      .sort((left, right) => right.sampleCount - left.sampleCount)
      .slice(0, 5),
    recentSamples: [...samples]
      .sort((left, right) =>
        right.capturedAt.localeCompare(left.capturedAt),
      )
      .slice(0, 6),
  };
}

function toMarker(sample: Sample): SampleMarker {
  return {
    id: sample.id,
    sampleId: sample.sampleId,
    lat: sample.latitude,
    lng: sample.longitude,
    capturedAt: sample.capturedAt,
    microplasticEstimate: sample.microplasticEstimate,
    confidence: sample.confidence,
    deviceId: sample.device?.deviceId ?? sample.deviceId ?? "unknown",
  };
}

export async function login(email: string, password: string) {
  return request<{ user: User; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  return request<User>("/auth/me");
}

export async function getSamples(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }

  return request<SamplesResponse>(
    `/samples${search.size > 0 ? `?${search.toString()}` : ""}`,
  );
}

export async function getSample(id: string) {
  const response = await request<{ sample: Sample }>(`/samples/${id}`);
  return response.sample;
}

export async function getSampleStats() {
  try {
    return await request<SampleStats>("/samples/stats");
  } catch {
    const [samples, devices] = await Promise.all([
      getSamples({ limit: 100 }),
      getDevices(),
    ]);
    return deriveStats(samples.data, devices);
  }
}

export async function getSampleMarkers(filters: Record<string, string | number | undefined>, includeVelocity = false) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }

  let markers: SampleMarker[];

  try {
    const response = await request<{ items: SampleMarker[] }>(
      `/samples/map${search.size > 0 ? `?${search.toString()}` : ""}`,
    );
    markers = response.items;
  } catch {
    const fallback = await getSamples({
      deviceId: filters.deviceId,
      from: filters.from,
      to: filters.to,
      limit: 100,
    });
    markers = fallback.data.map(toMarker);
  }

  if (includeVelocity && markers.length > 0) {
    const velocityData = await getVelocityForPoints(
      markers.map(m => ({ lat: m.lat, lng: m.lng }))
    );
    markers = markers.map((marker, i) => ({
      ...marker,
      velocity: velocityData[i] ?? undefined,
    }));
  }

  return markers;
}

export async function getDevices() {
  const response = await request<{ devices: Device[] }>("/devices");
  return response.devices;
}

export async function getDevice(id: string) {
  const response = await request<{ device: Device }>(`/devices/${id}`);
  return response.device;
}

export async function getDeviceSamples(id: string) {
  try {
    const response = await request<{ samples: Sample[] }>(`/devices/${id}/samples`);
    return response.samples;
  } catch {
    const device = await getDevice(id);
    const response = await getSamples({ deviceId: device.deviceId, limit: 100 });
    return response.data;
  }
}

export async function getUsers() {
  const response = await request<{ users: User[] }>("/admin/users");
  return response.users;
}

export async function getAuditLogs() {
  try {
    const response = await request<{ data: AuditLog[] }>("/admin/audit-logs");
    return response.data;
  } catch {
    const response = await request<{ data: AuditLog[] }>("/admin/audit-log");
    return response.data;
  }
}

export async function getAdminOverview() {
  try {
    return await request<AdminOverview>("/admin/overview");
  } catch {
    const [users, auditLogs] = await Promise.all([getUsers(), getAuditLogs()]);
    return {
      totalUsers: users.length,
      adminUsers: users.filter((user) => user.role === "admin").length,
      researchers: users.filter((user) => user.role === "researcher").length,
      viewers: users.filter((user) => user.role === "viewer").length,
      recentAuditEvents: auditLogs.slice(0, 10).length,
      newestUsers: users.slice(0, 5),
    };
  }
}

export async function updateUserRole(id: string, role: UserRole) {
  const response = await request<{ user: User }>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return response.user;
}

export async function getVelocityForPoints(
  points: Array<{ lat: number; lng: number }>
): Promise<Array<{ u: number; v: number; speed: number; direction: number } | null>> {
  if (points.length === 0) return [];

  const results: Array<{ u: number; v: number; speed: number; direction: number } | null> = [];
  
  const batchSize = 10;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    const promises = batch.map(async (point) => {
      try {
        return await request<{ u: number; v: number; speed: number; direction: number }>(
          `/velocity?lat=${point.lat}&lon=${point.lng}`
        );
      } catch {
        return null;
      }
    });
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  return results;
}

export { ApiError };
