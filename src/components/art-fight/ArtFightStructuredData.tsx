import { getTranslations } from "next-intl/server";
import { siteUrl } from "@/app/seo-metadata";
import { routing } from "@/i18n/routing";

function pagePath(locale: string) {
  return locale === routing.defaultLocale
    ? "/art-fight-image-hosting"
    : `/${locale}/art-fight-image-hosting`;
}

export type ArtFightStructuredDataPayload = {
  webApp: Record<string, unknown>;
  howTo: Record<string, unknown>;
  faq: Record<string, unknown>;
};

export async function getArtFightStructuredData(locale: string): Promise<ArtFightStructuredDataPayload> {
  const tSeo = await getTranslations({ locale, namespace: "artFight.seo" });
  const tHow = await getTranslations({ locale, namespace: "artFight.howTo" });
  const tFaq = await getTranslations({ locale, namespace: "artFight.faq" });

  const url = `${siteUrl}${pagePath(locale)}`;
  const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

  return {
    webApp: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${url}#webapp`,
      name: tSeo("title"),
      description: tSeo("description"),
      url,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      author: {
        "@type": "Organization",
        name: "Photo To URL",
        url: siteUrl,
      },
    },
    howTo: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: tHow("schemaName"),
      description: tHow("schemaDescription"),
      step: [
        { "@type": "HowToStep", position: 1, name: tHow("step1Title"), text: tHow("step1Desc") },
        { "@type": "HowToStep", position: 2, name: tHow("step2Title"), text: tHow("step2Desc") },
        { "@type": "HowToStep", position: 3, name: tHow("step3Title"), text: tHow("step3Desc") },
      ],
    },
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqKeys.map((key) => ({
        "@type": "Question",
        name: tFaq(`${key}Question`),
        acceptedAnswer: {
          "@type": "Answer",
          text: tFaq(`${key}Answer`),
        },
      })),
    },
  };
}

export function ArtFightStructuredDataScripts({ data }: { data: ArtFightStructuredDataPayload }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data.webApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data.howTo) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data.faq) }} />
    </>
  );
}
