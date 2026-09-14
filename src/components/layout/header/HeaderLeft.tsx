"use client";

import { LanguageSwitcher } from "../LanguageSwitcher";
import type { SiteHeaderTone } from "@/lib/constants/site-header-tone";

type HeaderLeftProps = {
  tone?: SiteHeaderTone;
};

export function HeaderLeft({ tone = "white" }: HeaderLeftProps) {
  return <LanguageSwitcher variant="header" tone={tone} />;
}
