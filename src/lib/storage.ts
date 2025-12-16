'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Role Key are required for storage operations');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type UploadResult =
  | { success: true; publicUrl: string }
  | { success: false; error: string };

export type DeleteResult = { success: boolean; error?: string };

/**
 * Upload supplier logo to Supabase Storage
 * Overwrites existing logo if one exists for this supplier
 */
export async function uploadSupplierLogo(
  file: File,
  supplierId: string
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${supplierId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('supplier_logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from('supplier_logos').getPublicUrl(filePath);

    return { success: true, publicUrl: data.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload bundle image to Supabase Storage
 * Used for bundle hero images and galleries
 */
export async function uploadBundleImage(
  file: File,
  bundleId: string
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${bundleId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('bundle_images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from('bundle_images').getPublicUrl(filePath);

    return { success: true, publicUrl: data.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload expert photo to Supabase Storage
 * Used for expert call host photos
 */
export async function uploadExpertPhoto(
  file: File,
  callId: string
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${callId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('expert_photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from('expert_photos').getPublicUrl(filePath);

    return { success: true, publicUrl: data.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete file from Supabase Storage
 * Generic function for any bucket
 */
export async function deleteFile(bucket: string, path: string): Promise<DeleteResult> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * List files in a storage bucket
 * Useful for admin interfaces
 */
export async function listFiles(bucket: string, path = ''): Promise<{
  success: boolean;
  files?: Array<{ name: string; size: number; createdAt: string }>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) {
      return { success: false, error: error.message };
    }

    const files = data.map((file) => ({
      name: file.name,
      size: file.metadata?.size || 0,
      createdAt: file.created_at,
    }));

    return { success: true, files };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List files failed',
    };
  }
}

/**
 * Get public URL for a file
 * Does not check if file exists
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
