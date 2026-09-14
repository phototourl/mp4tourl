import type { Metadata } from "next";
import { PdfToUrlTool } from "@/components/pdf-to-url/PdfToUrlTool";
import { ScrollButtons } from "@/components/shared/ScrollButtons";
import { getTranslations } from "next-intl/server";
import { siteUrl } from "@/app/seo-metadata";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "pdfToUrl.seo" });
  const canonicalUrl = `${siteUrl}/pdf-to-url`;
  const keywordsString = t("keywords");
  const keywords =
    keywordsString && typeof keywordsString === "string" && keywordsString.trim()
      ? keywordsString.split(",").map((k: string) => k.trim()).filter(Boolean)
      : [];
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = l === locale ? canonicalUrl : `${siteUrl}/${l}/pdf-to-url`;
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

export default async function PdfToUrlDefaultPage() {
  return (
    <>
      <div className="mx-auto max-w-6xl bg-white px-6 lg:px-10">
        <section className="relative bg-white pb-24 pt-6 sm:pb-28 sm:pt-10 lg:pb-32 lg:pt-14">
          <PdfToUrlTool />
        </section>
      </div>
      <ScrollButtons />
    </>
  );
}
