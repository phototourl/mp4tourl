"use client";

import { Code2, Link2, Shield, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = [Zap, Link2, Code2, Shield] as const;
const FEATURE_ACCENTS = [
  "bg-orange-50 text-orange-700",
  "bg-blue-50 text-blue-700",
  "bg-violet-50 text-violet-700",
  "bg-slate-100 text-slate-800",
] as const;

export function ArtFightFeatures() {
  const t = useTranslations("artFight.features");

  const items = [
    { title: t("fastTitle"), desc: t("fastDesc") },
    { title: t("linkTitle"), desc: t("linkDesc") },
    { title: t("embedTitle"), desc: t("embedDesc") },
    { title: t("safeTitle"), desc: t("safeDesc") },
  ];

  return (
    <section aria-labelledby="art-fight-features-title" className="mt-14">
      <h2 id="art-fight-features-title" className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">
        {t("sectionTitle")}
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ title, desc }, index) => {
          const Icon = FEATURE_ICONS[index];
          return (
            <article
              key={title}
              className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 text-left shadow-sm backdrop-blur-sm"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  FEATURE_ACCENTS[index],
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{desc}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
