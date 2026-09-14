"use client";

import { Circle, Sparkles, SquareRoundCorner } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DashboardArtFightEmbedActions } from "@/components/dashboard/DashboardArtFightEmbedActions";
import { isArtFightUser } from "@/lib/constants/user-type";
import { PLAN_TIER_YEARLY, type PlanTier } from "@/lib/constants/plans";
import { cn } from "@/lib/utils";

type DashboardPhotoToolboxActionsProps = {
  resource: {
    originalUrl: string;
    processedUrl?: string | null;
    filename: string;
  };
  userType?: string | null;
  isPaidSubscriptionActive: boolean;
  planTier?: PlanTier | string | null;
  locale: string;
  /** Table row uses default icon buttons; photo wall uses smaller grid buttons. */
  variant?: "table" | "grid";
};

export function DashboardPhotoToolboxActions({
  resource,
  userType,
  isPaidSubscriptionActive,
  planTier,
  locale,
  variant = "table",
}: DashboardPhotoToolboxActionsProps) {
  const t = useTranslations("Dashboard");

  if (isArtFightUser(userType)) {
    return (
      <DashboardArtFightEmbedActions
        url={resource.originalUrl}
        filename={resource.filename}
        variant={variant}
      />
    );
  }

  if (!isPaidSubscriptionActive) {
    return null;
  }

  const iconClass = variant === "grid" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btnClass =
    variant === "grid"
      ? "ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md opacity-90"
      : "h-8 w-8 p-0 rounded-md ptu-action-btn";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn(btnClass, variant === "grid" && "sm:opacity-90")}
        onClick={() => {
          window.location.href = `/${locale}/circle-crop?url=${encodeURIComponent(resource.originalUrl)}`;
        }}
        aria-label={t("circleCrop")}
      >
        <Circle className={iconClass} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={btnClass}
        onClick={() => {
          window.location.href = `/${locale}/rounded-corners?url=${encodeURIComponent(resource.originalUrl)}`;
        }}
        aria-label={t("roundedCorners")}
      >
        <SquareRoundCorner className={iconClass} />
      </Button>
      {planTier === PLAN_TIER_YEARLY && (
        <Button
          variant="ghost"
          size="sm"
          className={btnClass}
          onClick={() => {
            window.location.href = `/${locale}/remove-background?url=${encodeURIComponent(resource.originalUrl)}`;
          }}
          aria-label={t("removeBackground")}
        >
          <Sparkles className={iconClass} />
        </Button>
      )}
    </>
  );
}
