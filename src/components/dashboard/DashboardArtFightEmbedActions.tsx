"use client";

import { useEffect, useState } from "react";
import { Brackets, Check, Code2, FileCode, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildEmbedCode, defaultAltFromFileName, type EmbedCodeKind } from "@/lib/embed-code";
import { cn } from "@/lib/utils";

const ART_FIGHT_TABS: EmbedCodeKind[] = ["url", "html", "bbcode", "markdown"];

const TAB_ICONS = {
  url: Link2,
  html: Code2,
  bbcode: Brackets,
  markdown: FileCode,
} as const;

/** Match My Photos table row action buttons in dashboard/page.tsx */
const TABLE_ACTION_BTN_CLASS = "h-8 w-8 p-0 rounded-md ptu-action-btn";

const GRID_ACTION_BTN_CLASS =
  "ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md opacity-90";

type DashboardArtFightEmbedActionsProps = {
  url: string;
  filename: string;
  variant?: "table" | "grid";
};

function tabLabel(
  tab: EmbedCodeKind,
  t: (key: "tabUrl" | "tabHtml" | "tabBbcode" | "tabMarkdown") => string,
): string {
  switch (tab) {
    case "url":
      return t("tabUrl");
    case "html":
      return t("tabHtml");
    case "bbcode":
      return t("tabBbcode");
    case "markdown":
      return t("tabMarkdown");
    default:
      return tab;
  }
}

export function DashboardArtFightEmbedActions({
  url,
  filename,
  variant = "table",
}: DashboardArtFightEmbedActionsProps) {
  const t = useTranslations("artFight.embed");
  const [copied, setCopied] = useState<EmbedCodeKind | null>(null);
  const alt = defaultAltFromFileName(filename);
  const isGrid = variant === "grid";

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(null), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copyTab = async (tab: EmbedCodeKind) => {
    await navigator.clipboard.writeText(buildEmbedCode(tab, url, alt));
    setCopied(tab);
  };

  const iconClass = isGrid ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <>
      {ART_FIGHT_TABS.map((tab) => {
        const isCopied = copied === tab;
        const label = tabLabel(tab, t);
        const Icon = TAB_ICONS[tab as keyof typeof TAB_ICONS];
        const tooltipText = isCopied ? t("copied") : label;

        return (
          <Tooltip key={tab}>
            <TooltipTrigger asChild>
              {/* span receives ref for Radix; Button does not forwardRef */}
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={isGrid ? GRID_ACTION_BTN_CLASS : TABLE_ACTION_BTN_CLASS}
                  aria-label={tooltipText}
                  onClick={() => void copyTab(tab)}
                >
                  {isCopied ? (
                    <Check className={cn(iconClass, "text-green-600")} aria-hidden />
                  ) : (
                    <Icon className={iconClass} aria-hidden />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="z-[80]">
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}
