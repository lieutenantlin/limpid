import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../aws/sampleRepository.js', () => ({
  upsertIngestedSample: vi.fn(),
}));

vi.mock('../aws/deviceRepository.js', () => ({
  updateDeviceHeartbeat: vi.fn(),
}));

vi.mock('../aws/auditRepository.js', () => ({
  logAuditEvent: vi.fn(),
}));

import { handler } from '../aws/handlers/iotIngest.js';
import * as samples from '../aws/sampleRepository.js';
import * as devices from '../aws/deviceRepository.js';

describe('AWS IoT ingest handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts a valid device sample payload', async () => {
    vi.mocked(samples.upsertIngestedSample).mockResolvedValue({
      id: 'sample-1',
      sampleId: '11111111-1111-1111-1111-111111111111',
      deviceId: 'unoq-001',
      capturedAt: '2026-04-19T00:00:00.000Z',
      receivedAt: '2026-04-19T00:00:01.000Z',
      latitude: 32.68,
      longitude: -117.18,
      microplasticEstimate: 12.4,
      unit: 'particles_per_ml',
      confidence: 0.91,
      modelVersion: 'v1.0.0',
      qualityScore: 0.7,
      notes: null,
      imageObjectKey: null,
      thumbnailObjectKey: null,
      source: 'edge',
      createdByUserId: null,
      tags: [],
    });
    vi.mocked(devices.updateDeviceHeartbeat).mockResolvedValue({
      id: 'unoq-001',
      deviceId: 'unoq-001',
      label: 'unoq-001',
      status: 'active',
      firmwareVersion: '1.0.0',
      modelVersion: 'v1.0.0',
      lastSeenAt: '2026-04-19T00:00:01.000Z',
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:01.000Z',
    });

    const response = await handler({
      sampleId: '11111111-1111-1111-1111-111111111111',
      deviceId: 'unoq-001',
      capturedAt: '2026-04-19T00:00:00.000Z',
      location: { lat: 32.68, lng: -117.18 },
      microplasticEstimate: 12.4,
      unit: 'particles_per_ml',
      confidence: 0.91,
      modelVersion: 'v1.0.0',
    });

    expect(response.sample.sampleId).toBe('11111111-1111-1111-1111-111111111111');
    expect(response.device.deviceId).toBe('unoq-001');
  });

  it('rejects invalid payloads', async () => {
    await expect(
      handler({
        sampleId: 'bad-id',
      }),
    ).rejects.toThrow();
  });
});
