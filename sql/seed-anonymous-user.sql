/*
  Seed the anonymous archive user for guest video uploads.
  Safe to run multiple times (INSERT IGNORE).

  Usage (MySQL):
    source sql/seed-anonymous-user.sql;
*/

INSERT IGNORE INTO `user` (
  `id`,
  `name`,
  `email`,
  `email_verified`,
  `created_at`,
  `updated_at`,
  `plan`,
  `files_guide_seen`
) VALUES (
  'anon_mp4tourl_uploads',
  'Anonymous',
  'anonymous@mp4tourl.internal',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'free',
  0
);
