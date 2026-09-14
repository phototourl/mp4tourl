import { getTranslations } from "next-intl/server";
import {
  generateFAQSchema,
  generateHowToSchema,
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateWebSiteSchema,
} from "@/lib/structured-data";

export type HomeStructuredDataPayload = {
  organization: Record<string, unknown>;
  website: Record<string, unknown>;
  faq: Record<string, unknown>;
  howTo: Record<string, unknown>;
  webApp: Record<string, unknown>;
};

/**
 * 首页结构化数据（服务端）：Organization + WebSite + FAQ + HowTo + WebApplication
 */
export async function getHomeStructuredData(locale: string): Promise<HomeStructuredDataPayload> {
  const t = await getTranslations({ locale, namespace: "home" });
  const tLongform = await getTranslations({ locale, namespace: "home.longform" });
  const tSeo = await getTranslations({ locale, namespace: "seo.home" });

  const faqItems = ([1, 2, 3, 4, 5, 6, 7, 8] as const).map((n) => ({
    question: tLongform(`faq.items.${n}.q`),
    answer: tLongform(`faq.items.${n}.a`),
  }));

  const howToSteps = ([1, 2, 3] as const).map((n) => ({
    name: t(`process.steps.${n}.title`),
    text: t(`process.steps.${n}.desc`),
  }));

  const featureList = [
    t("features.items.cdn.title"),
    t("features.items.save.title"),
    t("features.items.clipboard.title"),
    t("features.items.nosignup.title"),
  ];

  return {
    organization: generateOrganizationSchema(),
    website: generateWebSiteSchema(locale),
    faq: generateFAQSchema(faqItems, locale),
    howTo: generateHowToSchema(t("how.title"), t("how.note"), howToSteps, locale),
    webApp: generateSoftwareApplicationSchema(
      tSeo("title"),
      tSeo("description"),
      "UtilitiesApplication",
      featureList,
      locale
    ),
  };
}

export function HomeStructuredDataScripts({ data }: { data: HomeStructuredDataPayload }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.howTo) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.webApp) }}
      />
    </>
  );
}

interface HomeStructuredDataProps {
  locale: string;
}

/**
 * 兼容旧用法：页面内请优先 await getHomeStructuredData + HomeStructuredDataScripts
 *（Next 14 类型检查不接受 async 组件直接作 JSX）
 */
export async function HomeStructuredData({ locale }: HomeStructuredDataProps) {
  const data = await getHomeStructuredData(locale);
  return HomeStructuredDataScripts({ data });
}
