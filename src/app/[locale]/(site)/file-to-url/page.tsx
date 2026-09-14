import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { FileToUrlTool } from "@/components/file-to-url/FileToUrlTool";
import { ScrollButtons } from "@/components/shared/ScrollButtons";
import { getLocaleMetadata } from "@/app/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "fileToUrl.seo" });
  const keywordsString = t("keywords");
  const keywords =
    keywordsString && typeof keywordsString === "string" && keywordsString.trim()
      ? keywordsString.split(",").map((k: string) => k.trim()).filter(Boolean)
      : [];
  return getLocaleMetadata(locale, t("title"), t("description"), keywords.length > 0 ? keywords : []);
}

export default async function FileToUrlPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <div className="mx-auto max-w-6xl bg-white px-6 lg:px-10">
        <section className="relative bg-white pb-24 pt-6 sm:pb-28 sm:pt-10 lg:pb-32 lg:pt-14">
          <FileToUrlTool />
        </section>
      </div>
      <ScrollButtons />
    </>
  );
}
