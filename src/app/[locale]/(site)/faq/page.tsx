import type { Metadata } from "next";
import { siteUrl } from "@/app/seo-metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonicalPath = locale === "en" ? "/faq" : `/${locale}/faq`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  return {
    title: "FAQ | Photo To URL",
    description: "Frequently asked questions about Photo To URL.",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: "FAQ | Photo To URL",
      description: "Frequently asked questions about Photo To URL.",
      url: canonicalUrl,
    },
    twitter: {
      title: "FAQ | Photo To URL",
      description: "Frequently asked questions about Photo To URL.",
    },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home.longform.faq" });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
      <div className="mt-6 space-y-6">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="font-semibold text-slate-900">
              {t(`items.${idx}.q`)}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {t(`items.${idx}.a`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
