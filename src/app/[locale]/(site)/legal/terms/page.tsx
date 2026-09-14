import type { Metadata } from "next";
import { siteUrl } from "@/app/seo-metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/legal/LegalPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms.seo" });
  const canonicalPath = locale === "en" ? "/legal/terms" : `/${locale}/legal/terms`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.terms.page" });

  return (
    <LegalPage>
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-sm text-slate-500">{t("lastUpdated")}</p>
      <p className="mt-4 text-slate-700">{t("intro")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("acceptance.title")}</h2>
      <p className="mt-2 text-slate-700">{t("acceptance.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("serviceDescription.title")}</h2>
      <p className="mt-2 text-slate-700">{t("serviceDescription.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("useOfService.title")}</h2>
      <p className="mt-2 text-slate-700">{t("useOfService.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("userResponsibilities.title")}</h2>
      <p className="mt-2 text-slate-700">{t("userResponsibilities.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("prohibitedContent.title")}</h2>
      <p className="mt-2 text-slate-700">{t("prohibitedContent.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("ipAndContent.title")}</h2>
      <p className="mt-2 text-slate-700">{t("ipAndContent.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("subscriptions.title")}</h2>
      <p className="mt-2 text-slate-700">{t("subscriptions.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("billing.title")}</h2>
      <p className="mt-2 text-slate-700">{t("billing.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("cancellation.title")}</h2>
      <p className="mt-2 text-slate-700">{t("cancellation.content")}</p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-700">
        <li>{t("cancellation.item1")}</li>
        <li>{t("cancellation.item2")}</li>
      </ul>
      <p className="mt-2 text-slate-700">{t("cancellation.effect")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("refunds.title")}</h2>
      <p className="mt-2 text-slate-700">{t("refunds.general")}</p>
      <h3 className="mt-4 text-lg font-semibold">{t("refunds.eligibleTitle")}</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-700">
        <li>{t("refunds.item1")}</li>
        <li>{t("refunds.item2")}</li>
        <li>{t("refunds.item3")}</li>
        <li>{t("refunds.item4")}</li>
      </ul>
      <h3 className="mt-4 text-lg font-semibold">{t("refunds.howTitle")}</h3>
      <p className="mt-2 text-slate-700">{t("refunds.how")}</p>
      <h3 className="mt-4 text-lg font-semibold">{t("refunds.notTitle")}</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-700">
        <li>{t("refunds.not1")}</li>
        <li>{t("refunds.not2")}</li>
        <li>{t("refunds.not3")}</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">{t("disclaimer.title")}</h2>
      <p className="mt-2 text-slate-700">{t("disclaimer.text")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("limitationOfLiability.title")}</h2>
      <p className="mt-2 text-slate-700">{t("limitationOfLiability.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("termination.title")}</h2>
      <p className="mt-2 text-slate-700">{t("termination.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("changes.title")}</h2>
      <p className="mt-2 text-slate-700">{t("changes.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("governingLaw.title")}</h2>
      <p className="mt-2 text-slate-700">{t("governingLaw.content")}</p>

      <h2 className="mt-8 text-xl font-semibold">{t("contact.title")}</h2>
      <p className="mt-2 text-slate-700">
        {t("contact.text")}{" "}
        <a className="text-blue-600 hover:underline" href={`mailto:${t("contact.email")}`}>
          {t("contact.email")}
        </a>
      </p>
    </LegalPage>
  );
}
