export const SITE_HEADER_TONE_STORAGE_KEY = "ptu-site-header-tone";
export const SITE_HEADER_TONE_COOKIE = "ptu-site-header-tone";

export type SiteHeaderTone = "gradient" | "white";

export function parseSiteHeaderTone(
  v: string | null | undefined
): SiteHeaderTone {
  return v === "white" || v === "gradient" ? v : "white";
}

export function persistSiteHeaderTone(tone: SiteHeaderTone) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SITE_HEADER_TONE_STORAGE_KEY, tone);
  } catch {
    /* ignore */
  }
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${SITE_HEADER_TONE_COOKIE}=${tone};path=/;max-age=${maxAge};SameSite=Lax`;
}
