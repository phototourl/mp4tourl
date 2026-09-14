"use client";

import { useTranslations } from "next-intl";

const STEP_KEYS = ["step1", "step2", "step3"] as const;

export function ArtFightHowTo() {
  const t = useTranslations("artFight.howTo");

  return (
    <section aria-labelledby="art-fight-howto-title" className="mt-16">
      <div className="text-center">
        <h2 id="art-fight-howto-title" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{t("lead")}</p>
      </div>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {STEP_KEYS.map((key, index) => (
          <li
            key={key}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm dark:border-border dark:bg-card"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-sm font-bold text-white">
              {index + 1}
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-foreground">
              {t(`${key}Title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-muted-foreground">
              {t(`${key}Desc`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
