import { setRequestLocale } from "next-intl/server";
import HomePage from "@/components/home/HomePage";
import {
  getHomeStructuredData,
  HomeStructuredDataScripts,
} from "@/components/home/HomeStructuredData";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const structuredData = await getHomeStructuredData(locale);

  return (
    <>
      <HomeStructuredDataScripts data={structuredData} />
      <HomePage />
    </>
  );
}
