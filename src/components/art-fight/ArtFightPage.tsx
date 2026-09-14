"use client";

import { ApplyPendingUserType } from "@/components/auth/apply-pending-user-type";
import { ArtFightAccountBenefits } from "@/components/art-fight/ArtFightAccountBenefits";
import { ArtFightConversionCta } from "@/components/art-fight/ArtFightConversionCta";
import { ArtFightFaq } from "@/components/art-fight/ArtFightFaq";
import { ArtFightFeatures } from "@/components/art-fight/ArtFightFeatures";
import { ArtFightHero } from "@/components/art-fight/ArtFightHero";
import { ArtFightHowTo } from "@/components/art-fight/ArtFightHowTo";
import { ArtFightTeamsSection } from "@/components/art-fight/ArtFightTeamsSection";
import { ArtFightUploadSection } from "@/components/art-fight/ArtFightUploadSection";
import { ArtFightUseCases } from "@/components/art-fight/ArtFightUseCases";

export function ArtFightPage() {
  return (
    <div className="relative mx-auto max-w-6xl">
      <ApplyPendingUserType />
      <ArtFightHero />
      <ArtFightUploadSection />
      <ArtFightTeamsSection />
      <ArtFightAccountBenefits />
      <ArtFightUseCases />
      <ArtFightFeatures />
      <ArtFightHowTo />
      <ArtFightFaq />
      <ArtFightConversionCta />
    </div>
  );
}
