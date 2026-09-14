"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TEAM_KEYS = ["tragedy", "comedy", "mystery"] as const;

const TEAM_STYLES = {
  tragedy: {
    border: "border-blue-300/80",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100/40",
    badge: "bg-blue-600/10 text-blue-800",
    dot: "bg-blue-500",
  },
  comedy: {
    border: "border-orange-300/80",
    bg: "bg-gradient-to-br from-orange-50 to-amber-100/40",
    badge: "bg-orange-600/10 text-orange-900",
    dot: "bg-orange-500",
  },
  mystery: {
    border: "border-violet-300/80",
    bg: "bg-gradient-to-br from-violet-50 to-purple-100/40",
    badge: "bg-violet-600/10 text-violet-900",
    dot: "bg-violet-500",
  },
} as const;

export function ArtFightTeamsSection() {
  const t = useTranslations("artFight.teams");

  return (
    <section aria-labelledby="art-fight-teams-title" className="mt-8 scroll-mt-24">
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-5 py-7 shadow-sm sm:px-7 sm:py-8 dark:border-border dark:from-muted/30 dark:to-card">
        <div className="text-center">
          <h2 id="art-fight-teams-title" className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{t("lead")}</p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {TEAM_KEYS.map((key) => {
            const styles = TEAM_STYLES[key];
            return (
              <article
                key={key}
                className={cn(
                  "rounded-2xl border p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5",
                  styles.border,
                  styles.bg,
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                    styles.badge,
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", styles.dot)} aria-hidden />
                  {t(`${key}Name`)}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-slate-700">{t(`${key}Desc`)}</p>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm font-medium text-slate-700">{t("footnote")}</p>
      </div>
    </section>
  );
}
