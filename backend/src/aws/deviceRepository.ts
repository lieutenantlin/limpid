import {
  BatchGetCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { dynamo } from './dynamo.js';
import type { DeviceRecord, DeviceStatus } from './models.js';

function sortDevices(items: DeviceRecord[]) {
  return [...items].sort((left, right) => (right.lastSeenAt ?? '').localeCompare(left.lastSeenAt ?? ''));
}

export async function getDeviceByDeviceId(deviceId: string): Promise<DeviceRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: config.aws.dynamodb.devicesTable,
      Key: { deviceId },
    }),
  );

  return (result.Item as DeviceRecord | undefined) ?? null;
}

export async function getDeviceById(id: string): Promise<DeviceRecord | null> {
  const direct = await getDeviceByDeviceId(id);
  if (direct) return direct;

  const fallback = await dynamo.send(
    new ScanCommand({
      TableName: config.aws.dynamodb.devicesTable,
      FilterExpression: '#id = :id',
      ExpressionAttributeNames: { '#id': 'id' },
      ExpressionAttributeValues: { ':id': id },
      Limit: 1,
    }),
  );

  return ((fallback.Items ?? [])[0] as DeviceRecord | undefined) ?? null;
}

export async function putDevice(item: DeviceRecord): Promise<DeviceRecord> {
  await dynamo.send(
    new PutCommand({
      TableName: config.aws.dynamodb.devicesTable,
      Item: item,
    }),
  );

  return item;
}

export async function findOrCreateDevice(deviceId: string): Promise<DeviceRecord> {
  const existing = await getDeviceByDeviceId(deviceId);
  if (existing) {
    return putDevice({
      ...existing,
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const now = new Date().toISOString();
  return putDevice({
    id: deviceId,
    deviceId,
    label: deviceId,
    status: 'active',
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateDeviceHeartbeat(
  deviceId: string,
  firmwareVersion?: string,
  modelVersion?: string,
  status?: DeviceStatus,
): Promise<DeviceRecord> {
  const existing = await findOrCreateDevice(deviceId);

  return putDevice({
    ...existing,
    status: status ?? existing.status,
    firmwareVersion: firmwareVersion ?? existing.firmwareVersion ?? null,
    modelVersion: modelVersion ?? existing.modelVersion ?? null,
    lastSeenAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function listDevices(status?: DeviceStatus): Promise<DeviceRecord[]> {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: config.aws.dynamodb.devicesTable,
    }),
  );

  const items = (result.Items as DeviceRecord[] | undefined) ?? [];
  return sortDevices(status ? items.filter((device) => device.status === status) : items);
}

export async function updateDevice(id: string, updates: { label?: string; status?: DeviceStatus }): Promise<DeviceRecord | null> {
  const existing = await getDeviceById(id);
  if (!existing) return null;

  return putDevice({
    ...existing,
    ...(updates.label !== undefined ? { label: updates.label } : {}),
    ...(updates.status !== undefined ? { status: updates.status } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function getDevicesByIds(deviceIds: string[]): Promise<Map<string, DeviceRecord>> {
  if (deviceIds.length === 0) return new Map();

  const uniqueIds = [...new Set(deviceIds)];
  const result = await dynamo.send(
    new BatchGetCommand({
      RequestItems: {
        [config.aws.dynamodb.devicesTable]: {
          Keys: uniqueIds.map((deviceId) => ({ deviceId })),
        },
      },
    }),
  );

  const items = (result.Responses?.[config.aws.dynamodb.devicesTable] as DeviceRecord[] | undefined) ?? [];
  return new Map(items.map((device) => [device.deviceId, device]));
}
