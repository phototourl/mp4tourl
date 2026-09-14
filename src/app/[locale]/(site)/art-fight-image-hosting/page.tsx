import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { ArtFightPage } from "@/components/art-fight/ArtFightPage";
import {
  ArtFightStructuredDataScripts,
  getArtFightStructuredData,
} from "@/components/art-fight/ArtFightStructuredData";
import { ScrollButtons } from "@/components/shared/ScrollButtons";
import { siteUrl } from "@/app/seo-metadata";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "artFight.seo" });
  const canonicalUrl =
    locale === routing.defaultLocale
      ? `${siteUrl}/art-fight-image-hosting`
      : `${siteUrl}/${locale}/art-fight-image-hosting`;
  const keywordsString = t("keywords");
  const keywords =
    keywordsString && typeof keywordsString === "string" && keywordsString.trim()
      ? keywordsString.split(",").map((k: string) => k.trim()).filter(Boolean)
      : [];

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] =
      l === routing.defaultLocale
        ? `${siteUrl}/art-fight-image-hosting`
        : `${siteUrl}/${l}/art-fight-image-hosting`;
  }

  return {
    title: t("title"),
    description: t("description"),
    keywords: keywords.length > 0 ? keywords : [],
    alternates: { canonical: canonicalUrl, languages },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
      siteName: "Photo To URL",
      images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: t("title") }],
    },
    twitter: {
      title: t("title"),
      description: t("description"),
      card: "summary_large_image",
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function ArtFightImageHostingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const structuredData = await getArtFightStructuredData(locale);

  return (
    <>
      <ArtFightStructuredDataScripts data={structuredData} />
      <div className="mx-auto max-w-6xl bg-white px-6 lg:px-10">
        <section className="relative bg-white pb-24 pt-6 sm:pb-28 sm:pt-10 lg:pb-32 lg:pt-14">
          <ArtFightPage />
        </section>
      </div>
      <ScrollButtons />
    </>
  );
}
