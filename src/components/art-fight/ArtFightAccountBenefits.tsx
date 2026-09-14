"use client";

import {
  ArrowRight,
  Images,
  LayoutDashboard,
  LogIn,
  Search,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  DASHBOARD_BATCH_UPLOAD_MAX_MONTHLY,
  DASHBOARD_BATCH_UPLOAD_MAX_YEARLY,
} from "@/lib/constants/plans";
import { buildArtFightRegisterHref } from "@/lib/constants/user-type";
import { cn } from "@/lib/utils";
import { trackPricingRedirect } from "@/lib/analytics/pricing-redirect";

const BENEFIT_ICONS = [LayoutDashboard, Images, Search, Sparkles] as const;
const BENEFIT_ACCENTS = [
  "bg-teal-50 text-teal-700",
  "bg-orange-50 text-orange-700",
  "bg-blue-50 text-blue-700",
  "bg-violet-50 text-violet-700",
] as const;

const TIER_STYLES = [
  "border-slate-200 bg-slate-50/80",
  "border-teal-200 bg-teal-50/50",
  "border-violet-200 bg-violet-50/50",
] as const;

export function ArtFightAccountBenefits() {
  const t = useTranslations("artFight.accountBenefits");
  const locale = useLocale();

  const authReturnPath =
    locale === routing.defaultLocale
      ? "/art-fight-image-hosting"
      : `/${locale}/art-fight-image-hosting`;

  const registerHref = buildArtFightRegisterHref(authReturnPath);

  const batchValues = {
    monthlyMax: DASHBOARD_BATCH_UPLOAD_MAX_MONTHLY,
    yearlyMax: DASHBOARD_BATCH_UPLOAD_MAX_YEARLY,
  };

  const benefits = [
    { title: t("dashboardTitle"), desc: t("dashboardDesc") },
    { title: t("batchTitle"), desc: t("batchDesc", batchValues) },
    { title: t("manageTitle"), desc: t("manageDesc") },
    { title: t("proTitle"), desc: t("proDesc", batchValues) },
  ];

  const tiers = [
    { label: t("anonymousLabel"), desc: t("anonymousDesc") },
    { label: t("freeLabel"), desc: t("freeDesc") },
    { label: t("proLabel"), desc: t("proDesc", batchValues) },
  ];

  return (
    <section aria-labelledby="art-fight-account-benefits-title" className="mt-14">
      <div className="text-center sm:text-left">
        <h2
          id="art-fight-account-benefits-title"
          className="text-xl font-semibold text-slate-900 sm:text-2xl"
        >
          {t("sectionTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          {t("sectionLead")}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {benefits.map(({ title, desc }, index) => {
          const Icon = BENEFIT_ICONS[index];
          return (
            <article
              key={title}
              className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 text-left shadow-sm backdrop-blur-sm"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  BENEFIT_ACCENTS[index],
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{desc}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {tiers.map(({ label, desc }, index) => (
          <div
            key={label}
            className={cn(
              "rounded-xl border p-4 text-left",
              TIER_STYLES[index],
            )}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{label}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-blue-50/35 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 lg:max-w-md">
            <p className="text-sm font-semibold text-slate-900 sm:text-base">{t("ctaPanelTitle")}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{t("footnote")}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className="h-10 rounded-full bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-600"
              >
                <LocaleLink href={registerHref}>
                  {t("signUpCta")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </LocaleLink>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-full border-violet-200 bg-white/90 px-5 text-sm font-semibold text-violet-900 hover:bg-violet-50"
              >
                <LocaleLink href={`/auth/login?callbackUrl=${encodeURIComponent(authReturnPath)}`}>
                  <LogIn className="h-4 w-4" aria-hidden />
                  {t("loginCta")}
                </LocaleLink>
              </Button>
            </div>

            <div className="hidden h-8 w-px shrink-0 bg-violet-200/80 sm:block" aria-hidden />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <LocaleLink
                href="/dashboard"
                className="inline-flex items-center gap-1.5 font-medium text-violet-800 underline-offset-4 hover:text-violet-600 hover:underline"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                {t("dashboardCta")}
              </LocaleLink>
              <LocaleLink
                href="/pricing"
                className="inline-flex items-center gap-1.5 font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                onClick={() => {
                  trackPricingRedirect({
                    sourceModule: "art_fight_page",
                    sourceAction: "account_benefits_pro",
                    toPath: "/pricing",
                  });
                }}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                {t("proCta")}
              </LocaleLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
