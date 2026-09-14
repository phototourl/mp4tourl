"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/i18n/navigation";
import { trackPricingRedirect } from "@/lib/analytics/pricing-redirect";

export function ArtFightConversionCta() {
  const t = useTranslations("artFight.conversion");

  return (
    <section aria-labelledby="art-fight-conversion-title" className="mt-16">
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-teal-50 p-6 text-center shadow-sm sm:p-8 dark:border-teal-900/40 dark:from-teal-950/40 dark:via-card dark:to-teal-950/20">
        <h2 id="art-fight-conversion-title" className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-foreground">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-muted-foreground">
          {t("description")}
        </p>
        <Button asChild className="mt-5 gap-1.5">
          <LocaleLink
            href="/pricing"
            onClick={() => {
              trackPricingRedirect({
                sourceModule: "art_fight_page",
                sourceAction: "conversion_cta",
                toPath: "/pricing",
              });
            }}
          >
            {t("cta")}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </LocaleLink>
        </Button>
      </div>
    </section>
  );
}
