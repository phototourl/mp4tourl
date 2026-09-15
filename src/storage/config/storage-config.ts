import type { StorageConfig } from '../types';

/** Strip accidental quotes from .env values like R2_BUCKET="mp4tourl". */
function env(name: string, fallback = ''): string {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  return raw.replace(/^["']|["']$/g, '').trim();
}

/**
 * Cloudflare R2 — Dokploy Environment:
 * R2_BUCKET / R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_PUBLIC_BASE_URL
 */
export const storageConfig: StorageConfig = {
  region: env('R2_REGION', 'auto'),
  endpoint: env('R2_ENDPOINT') || undefined,
  accessKeyId: env('R2_ACCESS_KEY_ID'),
  secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
  bucketName: env('R2_BUCKET'),
  publicUrl: env('R2_PUBLIC_BASE_URL') || undefined,
  forcePathStyle: process.env.R2_FORCE_PATH_STYLE !== 'false',
};

export function isStorageConfigured(): boolean {
  const { endpoint, accessKeyId, secretAccessKey, bucketName, publicUrl } =
    storageConfig;
  return Boolean(
    endpoint && accessKeyId && secretAccessKey && bucketName && publicUrl
  );
}
