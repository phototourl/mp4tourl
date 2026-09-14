import {
  persistSiteHeaderTone,
  SITE_HEADER_TONE_STORAGE_KEY,
  type SiteHeaderTone,
} from "@/lib/constants/site-header-tone";

/** Dashboard storage: `default` = light, `technology` = dark tech theme */
export const DASHBOARD_THEME_STORAGE_KEY = "ptu-dashboard-theme";
/** Set when user toggles theme inside dashboard/settings (not homepage sync). */
export const DASHBOARD_THEME_EXPLICIT_KEY = "ptu-dashboard-theme-explicit";

/** Mobile browser/PWA chrome — match dashboard header / canvas */
export const DASHBOARD_THEME_COLOR_LIGHT = "#17A2B8";
export const DASHBOARD_THEME_COLOR_DARK = "#040d32";
/** Public pages / when leaving dashboard */
export const SITE_THEME_COLOR = "#14b8a6";

export type AppUiTheme = "light" | "dark";

export function headerToneFromAppTheme(theme: AppUiTheme): SiteHeaderTone {
  return theme === "light" ? "white" : "gradient";
}

export function dashboardThemeFromAppTheme(theme: AppUiTheme): "default" | "technology" {
  return theme === "light" ? "default" : "technology";
}

export function appThemeFromHeaderTone(tone: SiteHeaderTone): AppUiTheme {
  return tone === "white" ? "light" : "dark";
}

export function appThemeFromDashboardTheme(
  value: string | null | undefined
): AppUiTheme | null {
  if (value === "default") return "light";
  if (value === "technology") return "dark";
  return null;
}

/** Homepage nav theme only. Default: light. */
export function resolveSiteHeaderTheme(): AppUiTheme {
  if (typeof window === "undefined") return "light";
  try {
    const header = window.localStorage.getItem(SITE_HEADER_TONE_STORAGE_KEY);
    if (header === "white" || header === "gradient") {
      return appThemeFromHeaderTone(header);
    }
  } catch {
    /* ignore */
  }
  return "light";
}

/** Persist homepage nav theme only — does not touch dashboard. */
export function persistSiteHeaderTheme(theme: AppUiTheme) {
  if (typeof window === "undefined") return;
  persistSiteHeaderTone(headerToneFromAppTheme(theme));
}

/** Dashboard/settings theme only. Default: dark. */
export function resolveDashboardTheme(): AppUiTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);
    const explicit =
      window.localStorage.getItem(DASHBOARD_THEME_EXPLICIT_KEY) === "1";

    if (stored === "technology") return "dark";
    // Only honor light when user explicitly chose it on dashboard — ignore old homepage sync.
    if (stored === "default" && explicit) return "light";
  } catch {
    /* ignore */
  }
  return "dark";
}

/** Persist dashboard theme only — does not touch homepage nav. */
export function persistDashboardTheme(theme: AppUiTheme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DASHBOARD_THEME_STORAGE_KEY,
      dashboardThemeFromAppTheme(theme)
    );
    window.localStorage.setItem(DASHBOARD_THEME_EXPLICIT_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Keep mobile status bar / browser chrome in sync with UI theme.
 * Never detach theme-color nodes: Next viewport owns them in <head>;
 * removeChild orphans React fibers and crashes on locale switch / soft nav
 * (Cannot read properties of null (reading 'removeChild')).
 */
export function syncBrowserThemeColor(color: string) {
  if (typeof document === "undefined") return;
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    meta.setAttribute("data-ptu-theme-color", "1");
    document.head.appendChild(meta);
    return;
  }
  metas.forEach((el) => el.setAttribute("content", color));
}

/**
 * Prefer system browser chrome on dashboard: clear content in place.
 * Do not removeChild — those metas may be React-managed (Next viewport).
 */
export function removeBrowserThemeColor() {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.setAttribute("content", ""));
  document
    .querySelectorAll('meta[name="apple-mobile-web-app-status-bar-style"]')
    .forEach((el) => el.setAttribute("content", "default"));
}

function syncDocumentChromeBackground(color: string | null) {
  if (typeof document === "undefined") return;
  if (color) {
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
  } else {
    document.documentElement.style.backgroundColor = "";
    document.body.style.backgroundColor = "";
  }
}

export function applyDashboardHtmlTheme(theme: AppUiTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(
    "ptu-theme-technology",
    theme === "dark"
  );
  document.body.classList.remove("ptu-theme-technology");
  // 工作台不染色安全区：交给系统浏览器 chrome（白/深灰），不再跟顶栏 #17A2B8 / #040d32 走
  syncDocumentChromeBackground(null);
  removeBrowserThemeColor();
}

/** Clear dashboard chrome overrides when leaving dashboard/settings. */
export function clearDashboardChrome() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("ptu-theme-technology");
  document.body.classList.remove("ptu-theme-technology");
  syncDocumentChromeBackground(null);
  syncBrowserThemeColor(SITE_THEME_COLOR);
}
