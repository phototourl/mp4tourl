export const VIDEO_ACCEPT =
  'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg,video/ogg,video/3gpp,.mp4,.mov,.avi,.webm,.mkv,.mpeg,.mpg,.ogv,.3gp,.flv';

const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/avi',
  'video/x-matroska',
  'video/mpeg',
  'video/ogg',
  'video/3gpp',
  'video/x-flv',
]);

const ALLOWED_EXT = new Set([
  'mp4',
  'webm',
  'mov',
  'avi',
  'mkv',
  'mpeg',
  'mpg',
  'ogv',
  '3gp',
  'flv',
]);

export function isVideoFile(file: File): boolean {
  if (ALLOWED_MIME.has(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXT.has(ext);
}
