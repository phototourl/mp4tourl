import { setRequestLocale } from "next-intl/server";
import HomePage from "@/components/home/HomePage";
import {
  getHomeStructuredData,
  HomeStructuredDataScripts,
} from "@/components/home/HomeStructuredData";
import { routing } from "@/i18n/routing";

export default async function DefaultHomePage() {
  const locale = routing.defaultLocale;
  setRequestLocale(locale);
  const structuredData = await getHomeStructuredData(locale);

  return (
    <>
      <HomeStructuredDataScripts data={structuredData} />
      <HomePage />
    </>
  );
}
