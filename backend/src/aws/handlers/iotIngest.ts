import { z } from 'zod';
import { logAuditEvent } from '../auditRepository.js';
import { updateDeviceHeartbeat } from '../deviceRepository.js';
import { upsertIngestedSample } from '../sampleRepository.js';

const sampleSchema = z.object({
  sampleId: z.string().uuid(),
  deviceId: z.string(),
  capturedAt: z.string().datetime(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  microplasticEstimate: z.number(),
  unit: z.string(),
  confidence: z.number().min(0).max(1),
  modelVersion: z.string(),
  qualityScore: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
  imageObjectKey: z.string().optional(),
  thumbnailObjectKey: z.string().optional(),
  firmwareVersion: z.string().optional(),
  deviceStatus: z.enum(['active', 'inactive', 'maintenance']).optional(),
});

export async function handler(event: unknown) {
  const payload = sampleSchema.parse(event);

  const [sample, device] = await Promise.all([
    upsertIngestedSample(payload),
    updateDeviceHeartbeat(
      payload.deviceId,
      payload.firmwareVersion,
      payload.modelVersion,
      payload.deviceStatus,
    ),
  ]);

  await logAuditEvent(null, 'sample.ingest', 'sample', sample.id, {
    deviceId: payload.deviceId,
    via: 'iot-core',
  });

  return {
    sample: {
      id: sample.id,
      sampleId: sample.sampleId,
      receivedAt: sample.receivedAt,
    },
    device: {
      deviceId: device.deviceId,
      status: device.status,
      lastSeenAt: device.lastSeenAt,
    },
  };
}
