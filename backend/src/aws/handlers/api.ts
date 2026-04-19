import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { getStorage } from '../../storage/index.js';
import { requireAuth, requireRole } from '../auth.js';
import { empty, json, matchPath, normalizePath, parseBody } from '../http.js';
import type {
  DeviceRecord,
  SampleRecord,
  UserRole,
} from '../models.js';
import type { ApiGatewayEvent, ApiGatewayResult } from '../types.js';
import {
  getDeviceById,
  getDevicesByIds,
  listDevices,
  updateDevice,
} from '../deviceRepository.js';
import {
  listAuditLogs,
  logAuditEvent,
} from '../auditRepository.js';
import {
  deleteSample,
  getSampleById,
  listAllSamples,
  listSamples,
  updateSample,
  upsertIngestedSample,
} from '../sampleRepository.js';
import { ensureUserProfile, getUserProfilesByIds, listUserProfiles, updateUserRole } from '../userProfileRepository.js';

const listSamplesQuery = z.object({
  deviceId: z.string().optional(),
  source: z.enum(['edge', 'manual', 'imported']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const listDevicesQuery = z.object({
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
});

const updateSampleBody = z.object({
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateDeviceBody = z.object({
  label: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
});

const updateUserRoleBody = z.object({
  role: z.enum(['admin', 'researcher', 'viewer']),
});

const auditQuery = z.object({
  actorUserId: z.string().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const timeseriesQuery = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  interval: z.enum(['day', 'week']).optional().default('day'),
});

const presignBody = z.object({
  fileName: z.string().min(1),
});

const ingestSampleBody = z.object({
  sampleId: z.string().uuid(),
  deviceId: z.string().min(1),
  capturedAt: z.string().datetime(),
  location: z.object({ lat: z.number(), lng: z.number() }),
  microplasticEstimate: z.number(),
  unit: z.string(),
  confidence: z.number().min(0).max(1),
  modelVersion: z.string(),
  qualityScore: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
  imageObjectKey: z.string().optional(),
  thumbnailObjectKey: z.string().optional(),
});

function errorStatus(error: unknown): number {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  if (code === 'UNAUTHORIZED') return 401;
  if (code === 'FORBIDDEN') return 403;
  if (code === 'VALIDATION') return 400;
  return 500;
}

function normalizeTags(tags: string[]) {
  return tags.map((tag) => ({ tag }));
}

function groupTrend(samples: SampleRecord[]) {
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

function devicePreview(device: DeviceRecord | undefined) {
  return device ? { deviceId: device.deviceId, label: device.label } : undefined;
}

function mapSampleForList(sample: SampleRecord, devices: Map<string, DeviceRecord>) {
  return {
    ...sample,
    device: devicePreview(devices.get(sample.deviceId)),
    tags: normalizeTags(sample.tags),
  };
}

async function mapSampleForDetail(sample: SampleRecord, devices: Map<string, DeviceRecord>) {
  const storage = getStorage();
  const [imageUrl, thumbnailUrl] = await Promise.all([
    sample.imageObjectKey ? storage.getSignedDownloadUrl(sample.imageObjectKey) : Promise.resolve(undefined),
    sample.thumbnailObjectKey ? storage.getSignedDownloadUrl(sample.thumbnailObjectKey) : Promise.resolve(undefined),
  ]);

  return {
    ...sample,
    device: devicePreview(devices.get(sample.deviceId)),
    tags: sample.tags,
    imageUrl,
    thumbnailUrl,
  };
}

function toMarker(sample: SampleRecord) {
  return {
    id: sample.id,
    sampleId: sample.sampleId,
    lat: sample.latitude,
    lng: sample.longitude,
    capturedAt: sample.capturedAt,
    microplasticEstimate: sample.microplasticEstimate,
    confidence: sample.confidence,
    deviceId: sample.deviceId,
  };
}

function deriveSampleStats(samples: SampleRecord[], devices: DeviceRecord[]) {
  const today = new Date().toISOString().slice(0, 10);
  const averageEstimate =
    samples.reduce((sum, sample) => sum + sample.microplasticEstimate, 0) / Math.max(samples.length, 1);
  const topDevicesMap = new Map<
    string,
    { label: string; sampleCount: number; estimateTotal: number }
  >();

  for (const sample of samples) {
    const device = devices.find((candidate) => candidate.deviceId === sample.deviceId);
    const key = sample.deviceId;
    const current = topDevicesMap.get(key) ?? {
      label: device?.label ?? key,
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
    todaySamples: samples.filter((sample) => sample.capturedAt.startsWith(today)).length,
    activeDevices: devices.filter((device) => device.status === 'active').length,
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
    recentSamples: samples.slice(0, 6),
  };
}

function deriveTimeseries(samples: SampleRecord[], interval: 'day' | 'week', from?: string, to?: string) {
  const lowerBound = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const upperBound = to ?? new Date().toISOString();
  const grouped = new Map<string, { count: number; total: number }>();

  for (const sample of samples) {
    if (sample.capturedAt < lowerBound || sample.capturedAt > upperBound) continue;
    const bucket = interval === 'week'
      ? `${sample.capturedAt.slice(0, 4)}-W${Math.ceil((Number(sample.capturedAt.slice(8, 10)) || 1) / 7)}`
      : sample.capturedAt.slice(0, 10);
    const current = grouped.get(bucket) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += sample.microplasticEstimate;
    grouped.set(bucket, current);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({
      date,
      count: value.count,
      avgEstimate: value.total / value.count,
    }));
}

function methodOf(event: ApiGatewayEvent) {
  return event.requestContext?.http?.method ?? 'GET';
}

function validatedBody<T>(schema: z.ZodType<T>, event: ApiGatewayEvent): T {
  const parsed = schema.safeParse(parseBody(event));
  if (!parsed.success) {
    const error = new Error('Validation failed');
    (error as NodeJS.ErrnoException).code = 'VALIDATION';
    throw error;
  }
  return parsed.data;
}

function validatedQuery<T>(schema: z.ZodType<T>, event: ApiGatewayEvent): T {
  const parsed = schema.safeParse(event.queryStringParameters ?? {});
  if (!parsed.success) {
    const error = new Error('Validation failed');
    (error as NodeJS.ErrnoException).code = 'VALIDATION';
    throw error;
  }
  return parsed.data;
}

async function listSamplesResponse(event: ApiGatewayEvent) {
  const filters = validatedQuery(listSamplesQuery, event);
  const result = await listSamples(filters);
  const deviceMap = await getDevicesByIds(result.data.map((sample) => sample.deviceId));
  return json(200, {
    data: result.data.map((sample) => mapSampleForList(sample, deviceMap)),
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
}

export async function handler(event: ApiGatewayEvent): Promise<ApiGatewayResult> {
  try {
    const method = methodOf(event);
    const path = normalizePath(event.rawPath);

    if (method === 'GET' && path === '/health') {
      return json(200, {
        status: 'ok',
        version: '0.1.0',
        runtime: 'aws',
        timestamp: new Date().toISOString(),
      });
    }

    if (method === 'GET' && path === '/auth/me') {
      const identity = requireAuth(event);
      const profile = await ensureUserProfile(identity);
      return json(200, {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
    }

    if (method === 'POST' && path === '/auth/login') {
      return json(501, { error: 'Use Cognito hosted sign-in for AWS deployments.' });
    }

    if (method === 'POST' && path === '/auth/register') {
      return json(501, { error: 'Use Cognito user-pool sign-up for AWS deployments.' });
    }

    if (method === 'POST' && path === '/uploads/presign') {
      requireAuth(event);
      const body = validatedBody(presignBody, event);
      const storage = getStorage();
      const extension = body.fileName.includes('.') ? body.fileName.slice(body.fileName.lastIndexOf('.')) : '';
      const objectKey = `samples/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
      const uploadUrl = await storage.getSignedUploadUrl(objectKey);
      return json(200, { uploadUrl, objectKey });
    }

    if (method === 'POST' && path === '/ingest/sample') {
      const identity = requireAuth(event);
      const body = validatedBody(ingestSampleBody, event);
      const sample = await upsertIngestedSample(body, identity.id);
      await logAuditEvent(identity.id, 'sample.ingest', 'sample', sample.id, {
        deviceId: body.deviceId,
        via: 'rest',
      });
      return json(201, { sample: { id: sample.id, sampleId: sample.sampleId, receivedAt: sample.receivedAt } });
    }

    if (method === 'GET' && path === '/samples') {
      requireAuth(event);
      return listSamplesResponse(event);
    }

    if (method === 'GET' && path === '/samples/stats') {
      requireAuth(event);
      const samples = await listAllSamples();
      const devices = await listDevices();
      return json(200, deriveSampleStats(samples, devices));
    }

    if (method === 'GET' && path === '/samples/map') {
      requireAuth(event);
      const filters = validatedQuery(listSamplesQuery, event);
      const result = await listSamples(filters);
      return json(200, { items: result.data.map(toMarker) });
    }

    if (method === 'GET' && path === '/devices') {
      const identity = requireAuth(event);
      requireRole(identity, ['admin', 'researcher']);
      const query = validatedQuery(listDevicesQuery, event);
      const devices = await listDevices(query.status);
      return json(200, { devices });
    }

    if (method === 'GET' && path === '/velocity') {
      const params = event.queryStringParameters ?? {};
      const lat = params.lat;
      const lon = params.lon;

      if (!lat || !lon) {
        return json(400, { error: 'lat and lon are required query parameters' });
      }

      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);

      if (isNaN(latNum) || isNaN(lonNum)) {
        return json(400, { error: 'lat and lon must be valid numbers' });
      }

      return new Promise((resolve) => {
        const cwd = process.cwd();
        const isLocal = !cwd.includes('/dist');
        const scriptPath = isLocal
          ? `${cwd}/backend/scripts/velocity_lookup.py`
          : `${cwd}/scripts/velocity_lookup.py`;

        const proc = spawn('python', [scriptPath, '--lat', lat, '--lon', lon], {
          cwd: isLocal ? cwd : `${cwd}/backend`,
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
          if (code !== 0) {
            resolve(json(500, { error: 'Velocity lookup failed', details: stderr }));
            return;
          }

          const uMatch = stdout.match(/Eastern velocity \(u\):\s*([-\d.]+)/);
          const vMatch = stdout.match(/Northern velocity \(v\):\s*([-\d.]+)/);
          const speedMatch = stdout.match(/Speed:\s*([-\d.]+)/);
          const directionMatch = stdout.match(/Direction:\s*([-\d.]+)/);

          resolve(json(200, {
            u: uMatch ? parseFloat(uMatch[1]) : null,
            v: vMatch ? parseFloat(vMatch[1]) : null,
            speed: speedMatch ? parseFloat(speedMatch[1]) : null,
            direction: directionMatch ? parseFloat(directionMatch[1]) : null,
          }));
        });

        proc.on('error', (err) => {
          resolve(json(500, { error: 'Failed to run velocity lookup' }));
        });
      });
    }

    if (method === 'GET' && path === '/stats/overview') {
      requireAuth(event);
      const samples = await listAllSamples();
      const devices = await listDevices();
      return json(200, {
        totalSamples: samples.length,
        totalDevices: devices.length,
        avgMicroplasticEstimate:
          samples.reduce((sum, sample) => sum + sample.microplasticEstimate, 0) / Math.max(samples.length, 1),
        avgConfidence: samples.reduce((sum, sample) => sum + sample.confidence, 0) / Math.max(samples.length, 1),
        samplesBySource: samples.reduce<Record<string, number>>((acc, sample) => {
          acc[sample.source] = (acc[sample.source] ?? 0) + 1;
          return acc;
        }, {}),
        recentSamples: samples.filter((sample) => {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return new Date(sample.capturedAt).getTime() >= sevenDaysAgo;
        }).length,
      });
    }

    if (method === 'GET' && path === '/stats/timeseries') {
      requireAuth(event);
      const query = validatedQuery(timeseriesQuery, event);
      const samples = await listAllSamples();
      return json(200, { data: deriveTimeseries(samples, query.interval ?? 'day', query.from, query.to) });
    }

    if (method === 'GET' && path === '/admin/users') {
      const identity = requireAuth(event);
      requireRole(identity, ['admin']);
      const users = await listUserProfiles();
      return json(200, {
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    }

    if (method === 'GET' && path === '/admin/overview') {
      const identity = requireAuth(event);
      requireRole(identity, ['admin']);
      const [users, auditLogs] = await Promise.all([
        listUserProfiles(),
        listAuditLogs({ page: 1, limit: 10 }),
      ]);
      return json(200, {
        totalUsers: users.length,
        adminUsers: users.filter((user) => user.role === 'admin').length,
        researchers: users.filter((user) => user.role === 'researcher').length,
        viewers: users.filter((user) => user.role === 'viewer').length,
        recentAuditEvents: auditLogs.data.length,
        newestUsers: users.slice(0, 5).map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    }

    if (method === 'GET' && path === '/admin/audit-log') {
      const identity = requireAuth(event);
      requireRole(identity, ['admin']);
      const query = validatedQuery(auditQuery, event);
      const result = await listAuditLogs(query);
      const actorMap = await getUserProfilesByIds(
        result.data.map((log) => log.actorUserId).filter((value): value is string => Boolean(value)),
      );
      return json(200, {
        data: result.data.map((item) => ({
          ...item,
          actorUser: item.actorUserId
            ? (() => {
                const actor = actorMap.get(item.actorUserId);
                return actor ? { id: actor.id, email: actor.email, name: actor.name } : null;
              })()
            : null,
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    }

    const sampleDetailParams = matchPath(path, '/samples/{id}');
    if (sampleDetailParams && method === 'GET') {
      requireAuth(event);
      const sample = await getSampleById(sampleDetailParams['id']);
      if (!sample) return json(404, { error: 'Sample not found' });
      const deviceMap = await getDevicesByIds([sample.deviceId]);
      return json(200, { sample: await mapSampleForDetail(sample, deviceMap) });
    }

    if (sampleDetailParams && method === 'PATCH') {
      const identity = requireAuth(event);
      requireRole(identity, ['admin', 'researcher']);
      const body = validatedBody(updateSampleBody, event);
      const sample = await updateSample(sampleDetailParams['id'], body);
      if (!sample) return json(404, { error: 'Sample not found' });
      await logAuditEvent(identity.id, 'sample.update', 'sample', sample.id, body as Record<string, unknown>);
      const deviceMap = await getDevicesByIds([sample.deviceId]);
      return json(200, { sample: mapSampleForList(sample, deviceMap) });
    }

    if (sampleDetailParams && method === 'DELETE') {
      const identity = requireAuth(event);
      requireRole(identity, ['admin']);
      const deleted = await deleteSample(sampleDetailParams['id']);
      if (!deleted) return json(404, { error: 'Sample not found' });
      await logAuditEvent(identity.id, 'sample.delete', 'sample', sampleDetailParams['id']);
      return empty(204);
    }

    const deviceDetailParams = matchPath(path, '/devices/{id}');
    if (deviceDetailParams && method === 'GET') {
      requireAuth(event);
      const device = await getDeviceById(deviceDetailParams['id']);
      if (!device) return json(404, { error: 'Device not found' });
      return json(200, { device });
    }

    if (deviceDetailParams && method === 'PATCH') {
      const identity = requireAuth(event);
      requireRole(identity, ['admin']);
      const body = validatedBody(updateDeviceBody, event);
      const device = await updateDevice(deviceDetailParams['id'], body);
      if (!device) return json(404, { error: 'Device not found' });
      await logAuditEvent(identity.id, 'device.update', 'device', device.id, body as Record<string, unknown>);
      return json(200, { device });
    }

    const deviceSamplesParams = matchPath(path, '/devices/{id}/samples');
    if (deviceSamplesParams && method === 'GET') {
      requireAuth(event);
      const device = await getDeviceById(deviceSamplesParams['id']);
      if (!device) return json(404, { error: 'Device not found' });
      const result = await listSamples({ deviceId: device.deviceId, page: 1, limit: 100 });
      const deviceMap = await getDevicesByIds([device.deviceId]);
      return json(200, { samples: result.data.map((sample) => mapSampleForList(sample, deviceMap)) });
    }

    const adminUserParams = matchPath(path, '/admin/users/{id}');
    if (adminUserParams && method === 'PATCH') {
      const identity = requireAuth(event);
      requireRole(identity, ['admin']);
      const body = validatedBody(updateUserRoleBody, event);
      const user = await updateUserRole(adminUserParams['id'], body.role as UserRole);
      if (!user) return json(404, { error: 'User not found' });
      await logAuditEvent(identity.id, 'user.role_change', 'user', user.id, { newRole: body.role });
      return json(200, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          updatedAt: user.updatedAt,
        },
      });
    }

    return json(404, { error: 'Route not found' });
  } catch (error) {
    const statusCode = errorStatus(error);
    const message = error instanceof Error
      ? error.message
      : 'Internal server error';
    return json(statusCode, { error: statusCode === 500 ? 'Internal server error' : message });
  }
}
