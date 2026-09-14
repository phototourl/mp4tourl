import type { StorageConfig } from '../types';

/**
 * Cloudflare R2 — Dokploy Environment:
 * R2_BUCKET / R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_PUBLIC_BASE_URL
 */
export const storageConfig: StorageConfig = {
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET || '',
  publicUrl: process.env.R2_PUBLIC_BASE_URL,
  forcePathStyle: process.env.R2_FORCE_PATH_STYLE !== 'false',
};
