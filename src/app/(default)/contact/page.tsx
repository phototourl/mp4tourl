import type { Metadata } from "next";
import { siteUrl } from "@/app/seo-metadata";
import { ContactFormCard } from "@/components/contact/ContactFormCard";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = "en";
  const t = await getTranslations({ locale, namespace: "contact.seo" });
  const canonicalPath = "/contact";
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

export default async function ContactPage() {
  const locale = "en";
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact.page" });

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-1 text-slate-600">{t("subtitle")}</p>
      <p className="mt-2 text-slate-600">{t("introShort")}</p>

      <section className="mt-4">
        <h2 className="text-sm font-semibold text-slate-700">{t("whyTitle")}</h2>
        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-slate-600">
          <li>{t("why1")}</li>
          <li>{t("why2")}</li>
          <li>{t("why3")}</li>
          <li>{t("why4")}</li>
        </ul>
      </section>

      <div className="mt-8">
        <ContactFormCard />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">{t("expectTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("expectContent")}</p>
      </section>

      <p className="mt-8 text-center text-sm text-slate-500">
        {t("orEmail")}{" "}
        <a
          className="text-blue-600 hover:underline"
          href={`mailto:${t("email.address")}`}
        >
          {t("email.address")}
        </a>
      </p>
    </div>
  );
}


