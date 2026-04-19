import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { dynamo } from './dynamo.js';
import type { IngestSampleInput, SampleListFilters, SampleRecord } from './models.js';

function sortSamples(items: SampleRecord[]) {
  return [...items].sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
}

function withinRange(sample: SampleRecord, from?: string, to?: string) {
  if (from && sample.capturedAt < from) return false;
  if (to && sample.capturedAt > to) return false;
  return true;
}

function paginate<T>(items: T[], page = 1, limit = 20) {
  const boundedPage = Math.max(1, page);
  const boundedLimit = Math.min(100, Math.max(1, limit));
  const start = (boundedPage - 1) * boundedLimit;
  return {
    data: items.slice(start, start + boundedLimit),
    total: items.length,
    page: boundedPage,
    limit: boundedLimit,
  };
}

export async function getSampleBySampleId(sampleId: string): Promise<SampleRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: config.aws.dynamodb.samplesTable,
      Key: { sampleId },
    }),
  );

  return (result.Item as SampleRecord | undefined) ?? null;
}

export async function getSampleById(id: string): Promise<SampleRecord | null> {
  const direct = await getSampleBySampleId(id);
  if (direct) return direct;

  const fallback = await dynamo.send(
    new ScanCommand({
      TableName: config.aws.dynamodb.samplesTable,
      FilterExpression: '#id = :id',
      ExpressionAttributeNames: { '#id': 'id' },
      ExpressionAttributeValues: { ':id': id },
      Limit: 1,
    }),
  );

  return ((fallback.Items ?? [])[0] as SampleRecord | undefined) ?? null;
}

export async function putSample(item: SampleRecord): Promise<SampleRecord> {
  await dynamo.send(
    new PutCommand({
      TableName: config.aws.dynamodb.samplesTable,
      Item: item,
    }),
  );

  return item;
}

export async function upsertIngestedSample(data: IngestSampleInput, createdByUserId?: string | null): Promise<SampleRecord> {
  const existing = await getSampleBySampleId(data.sampleId);
  const receivedAt = existing?.receivedAt ?? new Date().toISOString();

  const item: SampleRecord = {
    id: existing?.id ?? data.sampleId,
    sampleId: data.sampleId,
    deviceId: data.deviceId,
    capturedAt: data.capturedAt,
    receivedAt,
    latitude: data.location.lat,
    longitude: data.location.lng,
    microplasticEstimate: data.microplasticEstimate,
    unit: data.unit,
    confidence: data.confidence,
    modelVersion: data.modelVersion,
    qualityScore: data.qualityScore ?? existing?.qualityScore ?? null,
    notes: data.notes ?? existing?.notes ?? null,
    imageObjectKey: data.imageObjectKey ?? existing?.imageObjectKey ?? null,
    thumbnailObjectKey: data.thumbnailObjectKey ?? existing?.thumbnailObjectKey ?? null,
    source: existing?.source ?? 'edge',
    createdByUserId: existing?.createdByUserId ?? createdByUserId ?? null,
    tags: existing?.tags ?? [],
  };

  return putSample(item);
}

export async function listSamples(filters: SampleListFilters) {
  let items: SampleRecord[];

  if (filters.deviceId) {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: config.aws.dynamodb.samplesTable,
        IndexName: config.aws.dynamodb.deviceCapturedAtIndex,
        KeyConditionExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ':deviceId': filters.deviceId,
        },
        ScanIndexForward: false,
      }),
    );

    items = (result.Items as SampleRecord[] | undefined) ?? [];
  } else {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: config.aws.dynamodb.samplesTable,
      }),
    );

    items = (result.Items as SampleRecord[] | undefined) ?? [];
  }

  const filtered = sortSamples(
    items.filter((sample) => {
      if (filters.source && sample.source !== filters.source) return false;
      return withinRange(sample, filters.from, filters.to);
    }),
  );

  return paginate(filtered, filters.page, filters.limit);
}

export async function listAllSamples(): Promise<SampleRecord[]> {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: config.aws.dynamodb.samplesTable,
    }),
  );

  return sortSamples((result.Items as SampleRecord[] | undefined) ?? []);
}

export async function updateSample(id: string, updates: { notes?: string; tags?: string[] }): Promise<SampleRecord | null> {
  const existing = await getSampleById(id);
  if (!existing) return null;

  const item: SampleRecord = {
    ...existing,
    ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
  };

  return putSample(item);
}

export async function deleteSample(id: string): Promise<boolean> {
  const existing = await getSampleById(id);
  if (!existing) return false;

  await dynamo.send(
    new DeleteCommand({
      TableName: config.aws.dynamodb.samplesTable,
      Key: { sampleId: existing.sampleId },
    }),
  );

  return true;
}
