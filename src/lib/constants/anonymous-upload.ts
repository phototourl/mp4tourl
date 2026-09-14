/**
 * Anonymous uploads are persisted under this fixed user id (FK → `user.id`).
 * Override via env in deployment if needed.
 */
export const ANON_DB_USER_ID =
  process.env.ANON_DB_USER_ID?.trim() || 'V7YkTFibNbOMPCmdUafUTbGuL1CiwPNg';

/** Client-side daily cap key — shared by homepage & Art Fight. */
export const ANONYMOUS_UPLOAD_STORAGE_KEY = 'mp4tourl_anonymous_uploads';

/** Anonymous uploads per browser per day (stricter than logged-in free). */
export const ANONYMOUS_UPLOAD_LIMIT = 5;
