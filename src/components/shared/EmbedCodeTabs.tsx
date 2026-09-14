"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildEmbedCode, type EmbedCodeTab } from "@/lib/embed-code";

type EmbedCodeTabsProps = {
  url: string;
  alt: string;
  onAltChange?: (alt: string) => void;
  defaultTab?: EmbedCodeTab;
  translationNamespace?: string;
  /** Anonymous users only get the direct URL; other formats prompt registration. */
  urlOnly?: boolean;
  onRegisterClick?: () => void;
};

const TAB_ORDER: EmbedCodeTab[] = ["url", "html", "bbcode", "markdown"];
const LOCKED_TABS: EmbedCodeTab[] = ["html", "bbcode", "markdown"];

export type { EmbedCodeTab };

export function EmbedCodeTabs({
  url,
  alt,
  onAltChange,
  defaultTab = "html",
  translationNamespace = "artFight.embed",
  urlOnly = false,
  onRegisterClick,
}: EmbedCodeTabsProps) {
  const t = useTranslations(translationNamespace);
  const [activeTab, setActiveTab] = useState<EmbedCodeTab>(urlOnly ? "url" : defaultTab);
  const [copiedTab, setCopiedTab] = useState<EmbedCodeTab | null>(null);

  useEffect(() => {
    if (urlOnly) setActiveTab("url");
  }, [urlOnly]);

  const isLockedTab = urlOnly && LOCKED_TABS.includes(activeTab);

  const activeCode = useMemo(
    () => buildEmbedCode(activeTab, url, alt),
    [activeTab, url, alt],
  );

  useEffect(() => {
    if (!copiedTab) return;
    const id = window.setTimeout(() => setCopiedTab(null), 1500);
    return () => window.clearTimeout(id);
  }, [copiedTab]);

  const copyActive = async () => {
    if (isLockedTab) return;
    await navigator.clipboard.writeText(activeCode);
    setCopiedTab(activeTab);
  };

  const tabLabel = (tab: EmbedCodeTab) => {
    switch (tab) {
      case "url":
        return t("tabUrl");
      case "html":
        return t("tabHtml");
      case "bbcode":
        return t("tabBbcode");
      case "markdown":
        return t("tabMarkdown");
    }
  };

  const handleTabClick = (tab: EmbedCodeTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-3">
      {onAltChange && !urlOnly ? (
        <div className="text-left">
          <label htmlFor="embed-alt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("altLabel")}
          </label>
          <input
            id="embed-alt"
            type="text"
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-teal/30 focus:border-brand-teal focus:ring-2 dark:border-border dark:bg-card"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-border dark:bg-muted/40">
        {TAB_ORDER.map((tab) => {
          const locked = urlOnly && LOCKED_TABS.includes(tab);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                activeTab === tab
                  ? "bg-white text-brand-teal shadow-sm dark:bg-card"
                  : "text-slate-600 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground",
                locked && activeTab !== tab && "opacity-70",
              )}
            >
              {locked ? <Lock className="h-3 w-3 shrink-0 opacity-60" aria-hidden /> : null}
              {tabLabel(tab)}
            </button>
          );
        })}
      </div>

      {isLockedTab ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-left dark:border-border dark:bg-muted/30">
          <p className="text-sm font-semibold text-slate-900 dark:text-foreground">{t("lockedTabTitle")}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-muted-foreground">
            {t("lockedTabDescription")}
          </p>
          {onRegisterClick ? (
            <Button type="button" size="sm" className="mt-3" onClick={onRegisterClick}>
              {t("lockedTabCta")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="relative rounded-xl border border-slate-200 bg-slate-950/5 p-3 text-left dark:border-border dark:bg-muted/20">
          <pre className="max-h-32 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-slate-800 dark:text-foreground sm:text-sm">
            {activeCode}
          </pre>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-3 gap-1.5"
            onClick={() => void copyActive()}
          >
            {copiedTab === activeTab ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden />
                {t("copy")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
