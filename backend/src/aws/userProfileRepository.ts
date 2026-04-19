import {
  BatchGetCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { dynamo } from './dynamo.js';
import type { AuthIdentity } from './auth.js';
import type { UserProfileRecord, UserRole } from './models.js';

export async function getUserProfileById(id: string): Promise<UserProfileRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: config.aws.dynamodb.userProfilesTable,
      Key: { cognitoSub: id },
    }),
  );

  return (result.Item as UserProfileRecord | undefined) ?? null;
}

export async function putUserProfile(item: UserProfileRecord): Promise<UserProfileRecord> {
  await dynamo.send(
    new PutCommand({
      TableName: config.aws.dynamodb.userProfilesTable,
      Item: item,
    }),
  );

  return item;
}

export async function ensureUserProfile(identity: AuthIdentity): Promise<UserProfileRecord> {
  const existing = await getUserProfileById(identity.cognitoSub);
  const now = new Date().toISOString();

  return putUserProfile({
    id: identity.cognitoSub,
    cognitoSub: identity.cognitoSub,
    email: identity.email || existing?.email || '',
    name: identity.name || existing?.name || identity.email || 'Unknown user',
    role: existing?.role ?? identity.role,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export async function listUserProfiles(): Promise<UserProfileRecord[]> {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: config.aws.dynamodb.userProfilesTable,
    }),
  );

  return ((result.Items as UserProfileRecord[] | undefined) ?? []).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserProfileRecord | null> {
  const existing = await getUserProfileById(id);
  if (!existing) return null;

  return putUserProfile({
    ...existing,
    role,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserProfilesByIds(ids: string[]): Promise<Map<string, UserProfileRecord>> {
  if (ids.length === 0) return new Map();

  const uniqueIds = [...new Set(ids)];
  const result = await dynamo.send(
    new BatchGetCommand({
      RequestItems: {
        [config.aws.dynamodb.userProfilesTable]: {
          Keys: uniqueIds.map((cognitoSub) => ({ cognitoSub })),
        },
      },
    }),
  );

  const items = (result.Responses?.[config.aws.dynamodb.userProfilesTable] as UserProfileRecord[] | undefined) ?? [];
  return new Map(items.map((item) => [item.cognitoSub, item]));
}
