import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../aws/userProfileRepository.js', () => ({
  ensureUserProfile: vi.fn(),
  listUserProfiles: vi.fn(),
  updateUserRole: vi.fn(),
  getUserProfilesByIds: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock('../aws/sampleRepository.js', () => ({
  listAllSamples: vi.fn(),
  listSamples: vi.fn(),
  getSampleById: vi.fn(),
  updateSample: vi.fn(),
  deleteSample: vi.fn(),
}));

vi.mock('../aws/deviceRepository.js', () => ({
  listDevices: vi.fn(),
  getDeviceById: vi.fn(),
  getDevicesByIds: vi.fn().mockResolvedValue(new Map()),
  updateDevice: vi.fn(),
}));

vi.mock('../aws/auditRepository.js', () => ({
  listAuditLogs: vi.fn(),
  logAuditEvent: vi.fn(),
}));

vi.mock('../storage/index.js', () => ({
  getStorage: () => ({
    getSignedDownloadUrl: vi.fn().mockResolvedValue('https://example.com/object'),
    getSignedUploadUrl: vi.fn().mockResolvedValue('https://example.com/upload'),
  }),
}));

import { handler } from '../aws/handlers/api.js';
import * as userProfiles from '../aws/userProfileRepository.js';
import * as samples from '../aws/sampleRepository.js';
import * as devices from '../aws/deviceRepository.js';

describe('AWS API handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns Cognito-backed user profile from /auth/me', async () => {
    vi.mocked(userProfiles.ensureUserProfile).mockResolvedValue({
      id: 'user-1',
      cognitoSub: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    });

    const response = await handler({
      rawPath: '/auth/me',
      requestContext: {
        http: { method: 'GET' },
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-1',
              email: 'admin@example.com',
              name: 'Admin',
              'cognito:groups': 'admin',
            },
          },
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('"role":"admin"');
  });

  it('derives /samples/stats from DynamoDB-backed repositories', async () => {
    vi.mocked(samples.listAllSamples).mockResolvedValue([
      {
        id: 'sample-1',
        sampleId: 'sample-1',
        deviceId: 'unoq-001',
        capturedAt: '2026-04-19T00:00:00.000Z',
        receivedAt: '2026-04-19T00:00:01.000Z',
        latitude: 32.68,
        longitude: -117.18,
        microplasticEstimate: 12.4,
        unit: 'particles_per_ml',
        confidence: 0.87,
        modelVersion: 'v1.0.0',
        qualityScore: 0.8,
        notes: null,
        imageObjectKey: null,
        thumbnailObjectKey: null,
        source: 'edge',
        createdByUserId: null,
        tags: [],
      },
    ]);
    vi.mocked(devices.listDevices).mockResolvedValue([
      {
        id: 'unoq-001',
        deviceId: 'unoq-001',
        label: 'UNO Q 001',
        status: 'active',
        lastSeenAt: '2026-04-19T00:00:00.000Z',
        createdAt: '2026-04-19T00:00:00.000Z',
        updatedAt: '2026-04-19T00:00:00.000Z',
      },
    ]);

    const response = await handler({
      rawPath: '/samples/stats',
      requestContext: {
        http: { method: 'GET' },
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-1',
              email: 'viewer@example.com',
              name: 'Viewer',
            },
          },
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('"totalSamples":1');
    expect(response.body).toContain('"activeDevices":1');
  });
});
