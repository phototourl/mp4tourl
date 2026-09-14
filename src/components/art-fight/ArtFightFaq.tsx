"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { LocaleLink } from "@/i18n/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

export function ArtFightFaq() {
  const t = useTranslations("artFight.faq");

  return (
    <section aria-labelledby="art-fight-faq-title" className="mt-16">
      <div className="text-center">
        <h2 id="art-fight-faq-title" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{t("lead")}</p>
      </div>

      <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-amber-200/90 bg-amber-50/80 p-4 text-left sm:p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div className="space-y-2 text-sm text-amber-950">
            <p className="font-semibold">{t("warningTitle")}</p>
            <p className="leading-relaxed text-amber-900/90">{t("warningBody")}</p>
            <p className="text-amber-900/80">
              <LocaleLink href="/legal/terms" className="font-medium underline underline-offset-4 hover:text-amber-950">
                {t("warningTermsLink")}
              </LocaleLink>
              {" · "}
              <LocaleLink href="/legal/privacy" className="font-medium underline underline-offset-4 hover:text-amber-950">
                {t("warningPrivacyLink")}
              </LocaleLink>
            </p>
          </div>
        </div>
      </div>

      <Accordion className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 dark:border-border dark:bg-card">
        {FAQ_KEYS.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger className="text-left text-sm font-medium text-slate-900 sm:text-base">
              {t(`${key}Question`)}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-slate-600 dark:text-muted-foreground">
              {t(`${key}Answer`)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
