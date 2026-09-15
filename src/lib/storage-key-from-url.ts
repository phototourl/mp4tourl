/**
 * Best-effort R2 object key from a public file URL.
 */
export function extractStorageKeyFromUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  try {
    const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '');
    if (base && url.startsWith(`${base}/`)) {
      return decodeURIComponent(url.slice(base.length + 1).split('?')[0]!);
    }
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, '');
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}
