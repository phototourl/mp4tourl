/**
 * R2 object key from a public CDN / storage URL — same approach as editstamp.
 * e.g. https://cdn.mp4tourl.com/video/free/uuid.mp4 → video/free/uuid.mp4
 */
export function extractStorageKeyFromUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname;
    const key = decodeURIComponent(
      (pathname.startsWith('/') ? pathname.slice(1) : pathname).split('?')[0]!
    ).replace(/^\/+/, '');
    if (!key) return null;

    // If a path-style URL accidentally includes the bucket as the first segment
    const bucket = process.env.R2_BUCKET?.replace(/^["']|["']$/g, '');
    if (bucket && (key === bucket || key.startsWith(`${bucket}/`))) {
      const stripped = key.slice(bucket.length).replace(/^\//, '');
      return stripped || null;
    }

    return key;
  } catch {
    return null;
  }
}
