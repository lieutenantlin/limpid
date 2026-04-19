export type UserRole = "admin" | "researcher" | "viewer";
export type DeviceStatus = "active" | "inactive" | "maintenance";
export type SampleSource = "edge" | "manual" | "imported";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Device {
  id: string;
  deviceId: string;
  label: string;
  status: DeviceStatus;
  firmwareVersion?: string | null;
  modelVersion?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SampleTag {
  id?: string;
  tag: string;
}

export interface Sample {
  id: string;
  sampleId: string;
  capturedAt: string;
  receivedAt?: string;
  latitude: number;
  longitude: number;
  microplasticEstimate: number;
  unit: string;
  confidence: number;
  modelVersion: string;
  qualityScore?: number | null;
  notes?: string | null;
  imageUrl?: string;
  thumbnailUrl?: string;
  source: SampleSource;
  deviceId?: string;
  device?: Pick<Device, "deviceId" | "label">;
  tags?: Array<SampleTag | string>;
}

export interface SamplesResponse {
  data: Sample[];
  total: number;
  page: number;
  limit: number;
}

export interface SampleStats {
  totalSamples: number;
  averageEstimate: number;
  todaySamples: number;
  activeDevices: number;
  trend: Array<{ date: string; averageEstimate: number; sampleCount: number }>;
  topDevices: Array<{ deviceId: string; label: string; sampleCount: number; averageEstimate: number }>;
  recentSamples: Sample[];
}

export interface SampleMarker {
  id: string;
  sampleId: string;
  lat: number;
  lng: number;
  capturedAt: string;
  microplasticEstimate: number;
  confidence: number;
  deviceId: string;
  velocity?: {
    u: number;
    v: number;
    speed: number;
    direction: number;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actorUser?: Pick<User, "id" | "email" | "name"> | null;
}

export interface AdminOverview {
  totalUsers: number;
  adminUsers: number;
  researchers: number;
  viewers: number;
  recentAuditEvents: number;
  newestUsers: User[];
}
