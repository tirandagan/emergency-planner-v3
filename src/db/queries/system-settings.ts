import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get a system setting by key with type casting
 */
export async function getSystemSetting<T = unknown>(key: string): Promise<T | null> {
  const [setting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  if (!setting) return null;

  // Parse value based on valueType
  switch (setting.valueType) {
    case 'number':
      return Number(setting.value) as T;
    case 'boolean':
      return (setting.value === 'true') as T;
    case 'object':
    case 'array':
      return JSON.parse(setting.value) as T;
    default:
      return setting.value as T;
  }
}

/**
 * Get all settings in a category
 */
export async function getSystemSettingsByCategory(
  category: string
): Promise<Record<string, unknown>> {
  const settings = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.category, category));

  const result: Record<string, unknown> = {};
  for (const setting of settings) {
    switch (setting.valueType) {
      case 'number':
        result[setting.key] = Number(setting.value);
        break;
      case 'boolean':
        result[setting.key] = setting.value === 'true';
        break;
      case 'object':
      case 'array':
        result[setting.key] = JSON.parse(setting.value);
        break;
      default:
        result[setting.key] = setting.value;
    }
  }

  return result;
}

/**
 * Update a system setting (admin only, validation should be in server action)
 */
export async function updateSystemSetting(
  key: string,
  value: unknown,
  modifiedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (!setting) {
      return { success: false, error: 'Setting not found' };
    }

    if (!setting.isEditable) {
      return { success: false, error: 'Setting is not editable' };
    }

    // Convert value to string based on type
    let stringValue: string;
    switch (setting.valueType) {
      case 'number':
      case 'boolean':
        stringValue = String(value);
        break;
      case 'object':
      case 'array':
        stringValue = JSON.stringify(value);
        break;
      default:
        stringValue = String(value);
    }

    await db
      .update(systemSettings)
      .set({
        value: stringValue,
        lastModifiedBy: modifiedBy,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.key, key));

    return { success: true };
  } catch (error) {
    console.error('Error updating system setting:', error);
    return { success: false, error: 'Failed to update setting' };
  }
}

/**
 * Get share link expiration days
 */
export async function getShareLinkExpirationDays(): Promise<number> {
  const days = await getSystemSetting<number>('share_link_expiration_days');
  return days ?? 30;
}

/**
 * Get deleted plans retention days
 */
export async function getDeletedPlansRetentionDays(): Promise<number> {
  const days = await getSystemSetting<number>('deleted_plans_retention_days');
  return days ?? 30;
}
