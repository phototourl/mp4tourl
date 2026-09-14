/**
 * Max file size for avatars / generic images (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Free-tier video upload cap, aligned with VideoToURL-style 100MB */
export const MAX_VIDEO_FILE_SIZE = 100 * 1024 * 1024;

/** R2 key prefix for free video uploads (folder already exists in bucket) */
export const VIDEO_STORAGE_FOLDER = 'video/free';

/**
 * Polling interval (2 seconds)
 */
export const PAYMENT_POLL_INTERVAL = 2000;

/**
 * Max polling time (1 minute)
 */
export const PAYMENT_MAX_POLL_TIME = 60000;

/**
 * Max retry attempts for finding payment records
 */
export const PAYMENT_RECORD_RETRY_ATTEMPTS = 30;

/**
 * Retry delay between attempts (2 seconds)
 */
export const PAYMENT_RECORD_RETRY_DELAY = 2000;
