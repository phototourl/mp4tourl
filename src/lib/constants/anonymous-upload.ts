/**
 * Anonymous video uploads are stored under this fixed user id (FK → `user.id`).
 * Override via `ANON_DB_USER_ID` in deployment if needed.
 */
export const ANON_DB_USER_ID =
  process.env.ANON_DB_USER_ID?.trim() || 'anon_mp4tourl_uploads';

/** Internal email for the anonymous archive user (not for login). */
export const ANON_DB_USER_EMAIL = 'anonymous@mp4tourl.internal';
