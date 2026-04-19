import { randomUUID } from 'node:crypto';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { dynamo } from './dynamo.js';
import type { AuditLogFilters, AuditLogRecord } from './models.js';

export async function logAuditEvent(
  actorUserId: string | null | undefined,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  const item: AuditLogRecord = {
    id: randomUUID(),
    actorUserId: actorUserId ?? null,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  };

  await dynamo.send(
    new PutCommand({
      TableName: config.aws.dynamodb.auditLogsTable,
      Item: item,
    }),
  );
}

export async function listAuditLogs(filters: AuditLogFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const result = await dynamo.send(
    new ScanCommand({
      TableName: config.aws.dynamodb.auditLogsTable,
    }),
  );

  const items = ((result.Items as AuditLogRecord[] | undefined) ?? [])
    .filter((item) => {
      if (filters.actorUserId && item.actorUserId !== filters.actorUserId) return false;
      if (filters.entityType && item.entityType !== filters.entityType) return false;
      if (filters.action && item.action !== filters.action) return false;
      return true;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  };
}
