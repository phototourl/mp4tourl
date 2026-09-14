"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleLink, useLocaleRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { PLAN_PAID } from "@/lib/constants/plans";
import { trackPricingRedirect } from "@/lib/analytics/pricing-redirect";
import { buildArtFightRegisterHref } from "@/lib/constants/user-type";
import { cn } from "@/lib/utils";

type RetentionTier = "anonymous" | "free" | "pro";

type ArtFightRetentionNoticeProps = {
  authReturnPath: string;
  registerHref?: string;
  className?: string;
};

const ANONYMOUS_LIMIT_KEYS = [
  "retentionAnonymousLimit1",
  "retentionAnonymousLimit2",
  "retentionAnonymousLimit3",
  "retentionAnonymousLimit4",
  "retentionAnonymousLimit5",
] as const;

export function ArtFightRetentionNotice({
  authReturnPath,
  registerHref: registerHrefProp,
  className,
}: ArtFightRetentionNoticeProps) {
  const t = useTranslations("artFight.upload");
  const router = useLocaleRouter();
  const [tier, setTier] = useState<RetentionTier | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveTier() {
      const { data: sessionData } = await authClient.getSession();
      const userId = sessionData?.user?.id;

      if (!userId) {
        if (!cancelled) setTier("anonymous");
        return;
      }

      try {
        const res = await fetch("/api/resources?metaOnly=1");
        if (!res.ok) {
          if (!cancelled) setTier("free");
          return;
        }
        const data = await res.json();
        const isPro = data?.plan === PLAN_PAID && Boolean(data?.subscriptionActive);
        if (!cancelled) setTier(isPro ? "pro" : "free");
      } catch {
        if (!cancelled) setTier("free");
      }
    }

    void resolveTier();
    return () => {
      cancelled = true;
    };
  }, []);

  const registerHref = registerHrefProp ?? buildArtFightRegisterHref(authReturnPath);

  if (!tier) return null;

  const title =
    tier === "anonymous"
      ? t("retentionAnonymousTitle")
      : tier === "free"
        ? t("retentionFreeTitle")
        : t("retentionProTitle");

  const isAnonymous = tier === "anonymous";

  return (
    <aside
      className={cn(
        "mt-5 rounded-xl border p-4 text-left",
        isAnonymous
          ? "border-amber-300/90 bg-amber-50/80 dark:border-amber-800/50 dark:bg-amber-950/30"
          : "border-amber-200/90 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20",
        className,
      )}
      aria-label={title}
    >
      <div className="flex gap-3">
        {isAnonymous ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{title}</p>

          {isAnonymous ? (
            <>
              <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                {t("retentionAnonymousIntro")}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                {ANONYMOUS_LIMIT_KEYS.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                {t("retentionAnonymousCta")}
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
              {tier === "free" ? t("retentionFreeBody") : t("retentionProBody")}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {tier === "anonymous" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    router.push(registerHref);
                  }}
                >
                  {t("retentionAnonymousSignUp")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    trackPricingRedirect({
                      sourceModule: "art_fight_upload",
                      sourceAction: "retention_anonymous_pro",
                      toPath: "/pricing",
                    });
                    router.push("/pricing");
                  }}
                >
                  {t("retentionAnonymousPro")}
                </Button>
              </>
            ) : null}
            {tier === "free" ? (
              <>
                <Button type="button" size="sm" asChild>
                  <LocaleLink href="/dashboard">{t("retentionFreeDashboard")}</LocaleLink>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    trackPricingRedirect({
                      sourceModule: "art_fight_upload",
                      sourceAction: "retention_free_upgrade",
                      toPath: "/pricing",
                    });
                    router.push("/pricing");
                  }}
                >
                  {t("retentionFreeUpgrade")}
                </Button>
              </>
            ) : null}
            {tier === "pro" ? (
              <Button type="button" size="sm" asChild>
                <LocaleLink href="/dashboard">{t("retentionProDashboard")}</LocaleLink>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
