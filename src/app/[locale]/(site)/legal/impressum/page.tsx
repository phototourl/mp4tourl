import type { Metadata } from "next";
import { siteUrl } from "@/app/seo-metadata";
import LegalPage from "@/components/legal/LegalPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonicalPath = locale === "en" ? "/legal/impressum" : `/${locale}/legal/impressum`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  return {
    title: "Impressum | Photo To URL",
    description: "Impressum for Photo To URL.",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: "Impressum | Photo To URL",
      description: "Impressum for Photo To URL.",
      url: canonicalUrl,
    },
    twitter: {
      title: "Impressum | Photo To URL",
      description: "Impressum for Photo To URL.",
    },
  };
}

export default function ImpressumPage() {
  return (
    <LegalPage>
      <h1 className="text-3xl font-bold">Impressum</h1>
      <p className="mt-4 text-slate-700">Operator: Photo To URL</p>
      <p className="mt-2 text-slate-700">
        Contact: <a className="text-blue-600 hover:underline" href="mailto:support@phototourl.com">support@phototourl.com</a>
      </p>
    </LegalPage>
  );
}
