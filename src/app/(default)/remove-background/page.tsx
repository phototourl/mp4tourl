import type { Metadata } from "next";
import { RemoveBackgroundTool } from "@/components/remove-background/RemoveBackgroundTool";
import { ScrollButtons } from "@/components/shared/ScrollButtons";
import { getTranslations } from "next-intl/server";
import { siteUrl } from "@/app/seo-metadata";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = routing.defaultLocale;
  const t = await getTranslations("removeBackground.seo");
  const canonicalUrl = `${siteUrl}/remove-background`;

  // 从翻译文件中获取关键词字符串，转换为数组
  const keywordsString = t("keywords");
  const keywords = keywordsString && typeof keywordsString === "string" && keywordsString.trim()
    ? keywordsString.split(",").map((k: string) => k.trim()).filter(Boolean)
    : [];

  // Build hreflang alternates for all locales
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = l === locale
      ? `${siteUrl}/remove-background`
      : `${siteUrl}/${l}/remove-background`;
  }

  return {
    title: t("title"),
    description: t("description"),
    keywords: keywords.length > 0 ? keywords : [],
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
      siteName: "Photo To URL",
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Remove Background Tool - AI-powered background removal from photos online",
        },
      ],
    },
    twitter: {
      title: t("title"),
      description: t("description"),
      card: "summary_large_image",
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function RemoveBackgroundPage() {
  const t = await getTranslations("removeBackground.page");
  const tSeo = await getTranslations("removeBackground.seo");

  // WebApplication schema for this AI-powered tool
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl}/remove-background#webapp`,
    "name": tSeo("title"),
    "description": tSeo("description"),
    "url": `${siteUrl}/remove-background`,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
    },
    "screenshot": `${siteUrl}/og-image.png`,
    "softwareVersion": "1.0",
    "datePublished": "2024-01-01T00:00:00Z",
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "Photo To URL",
      "url": siteUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Photo To URL",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/icons/light_58x58.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className="mx-auto max-w-6xl px-6 lg:px-10 bg-white">
        <section className="bg-white relative pt-4 pb-40 sm:pt-10 sm:pb-44 lg:pt-14 lg:pb-52">
          <RemoveBackgroundTool showHeading={true} />

          <div className="mt-12">
            <div className="mx-auto max-w-5xl space-y-4 text-center">
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                {t("sectionSubtitle")}
              </h2>
              <p className="mx-auto max-w-5xl text-sm text-slate-600 sm:text-base leading-relaxed">
                {t("description")}
              </p>
            </div>
          </div>
        </section>
      </div>

      <ScrollButtons />
    </>
  );
}
