import type { ReactNode } from "react";
import { cookies } from "next/headers";
import type { Viewport } from "next";
import { SiteChromeLayoutClient } from "@/components/layout/SiteChromeLayoutClient";
import {
  SITE_HEADER_TONE_COOKIE,
  parseSiteHeaderTone,
} from "@/lib/constants/site-header-tone";
import { SITE_THEME_COLOR } from "@/lib/app-ui-theme";

export const viewport: Viewport = {
  themeColor: SITE_THEME_COLOR,
};

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const jar = await cookies();
  const initialHeaderTone = parseSiteHeaderTone(
    jar.get(SITE_HEADER_TONE_COOKIE)?.value
  );

  return (
    <SiteChromeLayoutClient initialHeaderTone={initialHeaderTone}>
      {children}
    </SiteChromeLayoutClient>
  );
}
