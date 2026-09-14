"use client";

import { MessageCircle, Share2, UserCircle, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

const USE_CASE_ICONS = [UserCircle, Share2, MessageCircle, Globe] as const;

export function ArtFightUseCases() {
  const t = useTranslations("artFight.useCases");

  const items = [
    { title: t("profileTitle"), desc: t("profileDesc") },
    { title: t("socialTitle"), desc: t("socialDesc") },
    { title: t("discordTitle"), desc: t("discordDesc") },
    { title: t("portfolioTitle"), desc: t("portfolioDesc") },
  ];

  return (
    <section aria-labelledby="art-fight-usecases-title" className="mt-14">
      <div className="text-center">
        <h2 id="art-fight-usecases-title" className="text-xl font-semibold text-slate-900 sm:text-2xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">{t("lead")}</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map(({ title, desc }, index) => {
          const Icon = USE_CASE_ICONS[index];
          return (
            <article
              key={title}
              className="flex gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
