export type UserRole = 'admin' | 'researcher' | 'viewer';
export type DeviceStatus = 'active' | 'inactive' | 'maintenance';
export type SampleSource = 'edge' | 'manual' | 'imported';

export interface UserProfileRecord {
  id: string;
  cognitoSub: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRecord {
  id: string;
  deviceId: string;
  label: string;
  status: DeviceStatus;
  firmwareVersion?: string | null;
  modelVersion?: string | null;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SampleRecord {
  id: string;
  sampleId: string;
  deviceId: string;
  capturedAt: string;
  receivedAt: string;
  latitude: number;
  longitude: number;
  microplasticEstimate: number;
  unit: string;
  confidence: number;
  modelVersion: string;
  qualityScore?: number | null;
  notes?: string | null;
  imageObjectKey?: string | null;
  thumbnailObjectKey?: string | null;
  source: SampleSource;
  createdByUserId?: string | null;
  tags: string[];
}

export interface AuditLogRecord {
  id: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface IngestSampleInput {
  sampleId: string;
  deviceId: string;
  capturedAt: string;
  location: { lat: number; lng: number };
  microplasticEstimate: number;
  unit: string;
  confidence: number;
  modelVersion: string;
  qualityScore?: number;
  notes?: string;
  imageObjectKey?: string;
  thumbnailObjectKey?: string;
}

export interface SampleListFilters {
  deviceId?: string;
  source?: SampleSource;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogFilters {
  actorUserId?: string;
  entityType?: string;
  action?: string;
  page?: number;
  limit?: number;
}
