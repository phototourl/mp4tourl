"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  HeadphonesIcon,
  LayoutDashboard,
  Link2,
  Mail,
  MessageSquare,
  Sparkles,
  Upload,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/i18n/navigation";
import { buildArtFightRegisterHref } from "@/lib/constants/user-type";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const HERO_TABS = ["intro", "artist", "support"] as const;
type HeroTab = (typeof HERO_TABS)[number];

const AUTO_INTERVAL_MS = 7000;
const TOOL_ICONS = [Link2, LayoutDashboard, Sparkles] as const;
const SUPPORT_TOPIC_KEYS = ["topicEmbed", "topicAccount", "topicPlan", "topicFeedback"] as const;
const SUPPORT_TOPIC_ICONS = [Link2, LayoutDashboard, Sparkles, MessageSquare] as const;

const TEAM_ACCENTS = [
  {
    iconBg: "bg-blue-500/12 text-blue-600 ring-blue-400/25",
    card: "border-blue-200/70 bg-blue-50/50",
  },
  {
    iconBg: "bg-orange-500/12 text-orange-600 ring-orange-400/25",
    card: "border-orange-200/70 bg-orange-50/50",
  },
  {
    iconBg: "bg-violet-500/12 text-violet-600 ring-violet-400/25",
    card: "border-violet-200/70 bg-violet-50/50",
  },
] as const;

function tabLabel(tab: HeroTab, t: (key: "tabIntro" | "tabArtist" | "tabSupport") => string) {
  switch (tab) {
    case "intro":
      return t("tabIntro");
    case "artist":
      return t("tabArtist");
    case "support":
      return t("tabSupport");
  }
}

function HeroIntroPanel() {
  const t = useTranslations("artFight.hero");

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-white via-violet-50/40 to-orange-50/30 p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
        <div className="relative flex min-h-[9.5rem] items-center justify-center rounded-xl border border-dashed border-violet-200/80 bg-white/70">
          <div className="grid grid-cols-3 gap-2 px-4">
            <div className="h-16 w-14 rounded-lg bg-blue-400/25 ring-1 ring-blue-400/40" />
            <div className="h-20 w-16 rounded-lg bg-orange-400/25 ring-1 ring-orange-400/40" />
            <div className="h-16 w-14 rounded-lg bg-violet-400/25 ring-1 ring-violet-400/40" />
          </div>
          <span className="absolute left-4 top-4 inline-flex items-center rounded-full border border-violet-300/60 bg-violet-100/80 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
            {t("panelIntroTag")}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("panelIntroTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{t("panelIntroDesc")}</p>
          </div>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-600">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ready to share</span>
            <span className="font-semibold text-violet-700">100%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
            <div className="art-fight-progress-fill h-full w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroArtistAccountPanel() {
  const tAccount = useTranslations("artFight.artistAccount");
  const tHero = useTranslations("artFight.hero");
  const locale = useLocale();
  const registerHref = buildArtFightRegisterHref(
    locale === routing.defaultLocale
      ? "/art-fight-image-hosting"
      : `/${locale}/art-fight-image-hosting`,
  );

  const tools = [
    { title: tAccount("toolEmbedTitle"), desc: tAccount("toolEmbedDesc") },
    { title: tAccount("toolDashboardTitle"), desc: tAccount("toolDashboardDesc") },
    { title: tAccount("toolBatchTitle"), desc: tAccount("toolBatchDesc") },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-900">{tHero("panelArtistTitle")}</p>
      <ul className="space-y-2.5">
        {tools.map(({ title, desc }, index) => {
          const Icon = TOOL_ICONS[index];
          const accent = TEAM_ACCENTS[index];
          return (
            <li
              key={title}
              className={cn("flex gap-3 rounded-xl border p-3", accent.card)}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  accent.iconBg,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{desc}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <Button
        asChild
        size="lg"
        className="art-fight-hero-cta h-12 w-full rounded-full border-0 px-6 text-base font-semibold hover:brightness-105"
      >
        <LocaleLink href={registerHref}>
          {tAccount("registerCta")}
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
        </LocaleLink>
      </Button>
      <p className="text-xs leading-relaxed text-slate-500">{tAccount("footnote")}</p>
    </div>
  );
}

function HeroArtistSupportPanel() {
  const t = useTranslations("artFight.artistSupport");
  const tHero = useTranslations("artFight.hero");

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-white via-blue-50/30 to-violet-50/50 p-4 sm:p-5">
        <div className="pointer-events-none absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-blue-400/15 blur-3xl" aria-hidden />
        <div className="relative min-h-[9.5rem] rounded-xl border border-dashed border-violet-200/80 bg-white/75 p-4">
          <span className="absolute right-4 top-4 inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            {t("panelVisualTag")}
          </span>

          <div className="flex items-start gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm ring-4 ring-violet-100">
              <HeadphonesIcon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-slate-200/80 bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-600 sm:text-xs">
                {t("panelVisualQuestion")}
              </div>
              <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md border border-violet-200/70 bg-violet-600 px-3 py-2 text-[11px] leading-snug text-white sm:text-xs">
                {t("panelVisualReply")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">{tHero("panelSupportTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{tHero("panelSupportDesc")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SUPPORT_TOPIC_KEYS.map((key, index) => {
          const Icon = SUPPORT_TOPIC_ICONS[index];
          const accent = TEAM_ACCENTS[index % TEAM_ACCENTS.length];
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5",
                accent.card,
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                  accent.iconBg,
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </div>
              <span className="text-xs font-medium leading-tight text-slate-800 sm:text-[13px]">
                {t(key)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-600 sm:text-sm">{t("contactHint")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            className="rounded-full border-0 bg-violet-700 px-4 text-white hover:bg-violet-600"
          >
            <LocaleLink href="/contact">{t("contactCta")}</LocaleLink>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-full border-violet-200 bg-white/90 text-violet-800 hover:bg-violet-50"
          >
            <a href="mailto:support@phototourl.com">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {t("emailCta")}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ArtFightHero() {
  const t = useTranslations("artFight.hero");
  const tAccount = useTranslations("artFight.artistAccount");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<HeroTab>("intro");
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const registerHref = buildArtFightRegisterHref(
    locale === routing.defaultLocale
      ? "/art-fight-image-hosting"
      : `/${locale}/art-fight-image-hosting`,
  );

  const selectTab = useCallback((tab: HeroTab) => {
    setActiveTab(tab);
    setProgressKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setInterval(() => {
      setActiveTab((current) => {
        const idx = HERO_TABS.indexOf(current);
        return HERO_TABS[(idx + 1) % HERO_TABS.length];
      });
      setProgressKey((k) => k + 1);
    }, AUTO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, activeTab]);

  return (
    <header
      className="art-fight-hero relative overflow-hidden rounded-[1.75rem] px-5 py-8 text-white shadow-[0_24px_80px_-24px_rgba(46,31,92,0.65)] sm:px-8 sm:py-10 lg:px-10 lg:py-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12">
        {/* Left: marketing copy — title unchanged */}
        <div className="text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-100 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-orange-200" aria-hidden />
            {t("badge")}
          </div>

          <h1 className="mt-5 max-w-xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
            {t("title")}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-violet-100/90 sm:text-base">{t("subtitle")}</p>
          <p className="mt-3 max-w-xl text-sm text-white/85">{t("artistAccountLine")}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-300/35 bg-blue-500/20 px-2.5 py-1 text-[11px] font-medium text-blue-100">
              {t("teamTragedy")}
            </span>
            <span className="rounded-full border border-orange-300/35 bg-orange-500/20 px-2.5 py-1 text-[11px] font-medium text-orange-100">
              {t("teamComedy")}
            </span>
            <span className="rounded-full border border-violet-300/35 bg-violet-500/20 px-2.5 py-1 text-[11px] font-medium text-violet-100">
              {t("teamMystery")}
            </span>
          </div>

          <p className="mt-5 text-xs text-violet-200/70 sm:text-sm">{t("trustLine")}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="art-fight-hero-cta h-12 rounded-full border-0 px-8 text-base font-semibold hover:brightness-105"
            >
              <LocaleLink href={registerHref}>
                {tAccount("registerCta")}
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
              </LocaleLink>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full border border-white/30 bg-white/95 px-8 text-base font-semibold text-violet-950 shadow-sm hover:bg-white"
            >
              <a href="#art-fight-upload">
                <Upload className="mr-2 h-5 w-5 text-violet-700" aria-hidden />
                {t("uploadCta")}
              </a>
            </Button>
          </div>
        </div>

        {/* Right: sketchbook-style tab card */}
        <div className="art-fight-hero-panel rounded-[1.35rem] p-4 sm:p-5">
          <div
            role="tablist"
            aria-label={t("tabsAriaLabel")}
            className="flex items-center gap-1 border-b border-violet-100 pb-0"
          >
            {HERO_TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`art-fight-hero-tab-${tab}`}
                  aria-selected={isActive}
                  aria-controls={`art-fight-hero-panel-${tab}`}
                  onClick={() => selectTab(tab)}
                  className={cn(
                    "relative px-3 pb-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
                    isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {tabLabel(tab, t)}
                  {isActive ? (
                    <>
                      <span className="art-fight-tab-underline absolute inset-x-2 bottom-0 h-0.5 rounded-full" aria-hidden />
                      {!reduceMotion ? (
                        <span
                          key={progressKey}
                          className="absolute inset-x-2 bottom-0 h-0.5 origin-left rounded-full bg-violet-300/90 animate-[art-fight-tab-progress_7s_linear_forwards]"
                          aria-hidden
                        />
                      ) : null}
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="relative mt-5 min-h-[20rem] sm:min-h-[22rem]">
            {/* @ts-expect-error - framer-motion AnimatePresence return type vs React 18 JSX */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                role="tabpanel"
                id={`art-fight-hero-panel-${activeTab}`}
                aria-labelledby={`art-fight-hero-tab-${activeTab}`}
                initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {activeTab === "intro" ? <HeroIntroPanel /> : null}
                {activeTab === "artist" ? <HeroArtistAccountPanel /> : null}
                {activeTab === "support" ? <HeroArtistSupportPanel /> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
