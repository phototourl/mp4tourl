"use client";
import { LocaleLink } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Github, Twitter } from "lucide-react";
import { trackPricingRedirect } from "@/lib/analytics/pricing-redirect";
import { SelectRegionSection } from "@/components/shared/SelectRegionSection";
import { getEditStampUrl } from "@/lib/editstamp";

const navLinks = [
  // { key: "blog", href: "/blog" },
  { key: "about", href: "/about" },
  { key: "pricing", href: "/pricing" },
  { key: "contact", href: "/contact" },
  { key: "uploadHistory", href: "/" },
] as const;

const productLinks = [
  { key: "editStamp" as const, external: true as const },
  { href: "/pdf-to-url", external: false as const },
  { href: "/file-to-url", external: false as const },
  { href: "/art-fight-image-hosting", external: false as const },
] as const;

type SiteFooterProps = { onHistoryClick?: () => void };

export function SiteFooter({ onHistoryClick }: SiteFooterProps) {
  const t = useTranslations("common");
  const tImages = useTranslations("images");
  const tArtFight = useTranslations("artFight");
  const locale = useLocale();
  const editStampUrl = getEditStampUrl(locale);
  return (
    <footer>
      <SelectRegionSection translationKey="home.selectRegion" />
      <div className="border-t border-white/15 hero-gradient text-white">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-2 sm:px-6 lg:px-10 lg:pt-10 lg:pb-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4 md:gap-12 lg:gap-16">
            <div className="space-y-3">
              <LocaleLink href="/" className="flex items-center gap-3 group">
                <div className="relative h-8 w-8 overflow-hidden rounded-md bg-white/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-white/20">
                  <Image
                    src="/icons/light_58x58.png"
                    alt={tImages("logoAlt")}
                    width={32}
                    height={32}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                    unoptimized
                  />
                </div>
                <div className="text-xl font-semibold text-white transition-colors duration-300 group-hover:text-white/90">{t("siteName")}</div>
              </LocaleLink>
              <div className="flex items-center gap-2 pt-2">
                <a
                  href="https://github.com/phototourl"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://x.com/phototourl"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href={editStampUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label={t("footer.products.editStamp")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/edit-stamp32.png"
                    alt={t("footer.products.editStamp")}
                    width={30}
                    height={30}
                    className="h-[25px] w-[25px] object-contain"
                  />
                </a>
              </div>
              <LanguageSwitcher variant="footer" />
            </div>

            <div className="space-y-2.5">
              <div className="text-sm font-semibold uppercase tracking-wide text-white/80">{t("footer.linksTitle")}</div>
              <div className="flex flex-col gap-2 text-sm text-white/95">
                {navLinks.map((link) =>
                  link.key === "uploadHistory" ? (
                    <button
                      key={link.key}
                      onClick={onHistoryClick}
                      className="text-left underline-offset-4 hover:text-white hover:underline"
                    >
                      {t("header.history")}
                    </button>
                  ) : (
                    <LocaleLink
                      key={link.key}
                      href={link.href}
                      className="underline-offset-4 hover:text-white hover:underline"
                      onClick={() => {
                        if (link.href === "/pricing") {
                          trackPricingRedirect({
                            sourceModule: "site_footer",
                            sourceAction: "nav_pricing",
                            toPath: "/pricing",
                          });
                        }
                      }}
                    >
                      {t(`footer.nav.${link.key}`)}
                    </LocaleLink>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-sm font-semibold uppercase tracking-wide text-white/80">{t("footer.productsTitle")}</div>
              <div className="flex flex-col gap-2 text-sm text-white/95">
                {productLinks.map((link) => {
                  if (link.external) {
                    return (
                      <a
                        key={link.key}
                        href={editStampUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-4 hover:text-white hover:underline break-words"
                      >
                        {t("footer.products.editStamp")}
                      </a>
                    );
                  }

                  const label =
                    link.href === "/art-fight-image-hosting"
                      ? tArtFight("footerLink")
                      : link.href === "/pdf-to-url"
                        ? t("header.pdfToUrlNav")
                        : link.href === "/file-to-url"
                          ? t("header.fileToUrlNav")
                          : "";
                  return (
                    <LocaleLink
                      key={link.href}
                      href={link.href}
                      className="underline-offset-4 hover:text-white hover:underline break-words"
                    >
                      {label}
                    </LocaleLink>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-sm font-semibold uppercase tracking-wide text-white/80">{t("footer.legal.title")}</div>
              <div className="flex flex-col gap-2 text-sm text-white/95">
                <LocaleLink
                  href="/legal/privacy"
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  {t("footer.legal.privacy")}
                </LocaleLink>
                <LocaleLink
                  href="/legal/terms"
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  {t("footer.legal.terms")}
                </LocaleLink>
                <LocaleLink
                  href="/legal/cookie"
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  {t("footer.legal.cookie")}
                </LocaleLink>
              </div>
            </div>
          </div>
        </div>
        {/* Badge row: auto-scrolling marquee style */}
        <div className="overflow-hidden">
          <div className="px-6 py-4 lg:px-10">
            <div className="ptu-badge-marquee-track">
              <FooterBadgeGroup />
              <FooterBadgeGroup ariaHidden />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15 hero-gradient text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-4 text-xs lg:px-10">
          <span className="text-white/90 text-center">{t("footer.copyright").replace("2025", new Date().getFullYear().toString())}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterBadgeGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex w-max flex-nowrap items-center gap-1.5 pr-1.5"
      aria-hidden={ariaHidden}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://www.producthunt.com/products/photo-to-url?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-photo-to-url"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block transition-transform hover:scale-105"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1215815&theme=light&t=1785944095481"
          alt="Photo To URL - photo to url image free | Product Hunt"
          width={250}
          height={54}
          className="h-6 w-auto shrink-0"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://fazier.com/launches/phototourl.com" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" width={120} height={28} alt="Fazier badge" className="h-6 w-auto opacity-90 hover:opacity-100 transition-opacity shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://fwfw.app/item/photo-to-url" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://fwfw.app/badge-white.svg" width={250} height={54} alt="Featured on FWFW" className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://showmebest.ai" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://showmebest.ai/badge/feature-badge-dark.webp" width={120} height={28} alt="Featured on ShowMeBestAI" className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://submitaitools.org" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://submitaitools.org/static_submitaitools/images/submitaitools.png" width={120} height={28} alt="Submit AI Tools – The ultimate platform to discover, submit, and explore the best AI tools across various categories." className="h-6 w-auto rounded-[10px] shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://twelve.tools" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://twelve.tools/badge0-light.svg" width={120} height={28} alt="Featured on Twelve Tools" className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://wired.business" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://wired.business/badge3-dark.svg" alt="Featured on Wired Business" width={200} height={54} className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://frogdr.com/phototourl.com?utm_source=phototourl.com" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://frogdr.com/phototourl.com/badge-white.svg" width={120} height={28} alt="Monitor your Domain Rating with FrogDR" className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://findly.tools/photo-to-url?utm_source=photo-to-url" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://findly.tools/badges/findly-tools-badge-light.svg" alt="Featured on findly.tools" width={150} className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://goodaitools.com" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://goodaitools.com/assets/images/badge.png" alt="Good AI Tools" height={54} className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://dofollow.tools" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://dofollow.tools/badge/badge_light.svg" alt="Featured on Dofollow.Tools" width={200} height={54} className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://turbo0.com/item/photo-to-url" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://img.turbo0.com/badge-listed-light.svg" alt="Listed on Turbo0" height={54} className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://aiagentsdirectory.com/agent/photo-to-url?utm_source=badge&utm_medium=referral&utm_campaign=free_listing&utm_content=photo-to-url" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://aiagentsdirectory.com/featured-badge.svg?v=2024" alt="Photo To URL - Featured AI Agent on AI Agents Directory" width={200} height={50} className="h-6 w-auto shrink-0" />
      </a>
      <a href="https://aitop10.tools/" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <div className="h-6 px-2 flex items-center justify-center rounded bg-black text-white text-[10px] font-medium whitespace-nowrap shrink-0 leading-none">
          AiTop10 Tools Directory
        </div>
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://dayslaunch.com" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:scale-105">
        <img
          src="https://dayslaunch.com/badages-awards.svg"
          height={54}
          alt="Featured on Days Launch"
          className="h-6 w-auto shrink-0"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://www.toolpilot.ai" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://www.toolpilot.ai/cdn/shop/files/f-w_690x151_crop_center.png" alt="Featured on Toolpilot" width={120} height={28} className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://toolsfine.com" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://toolsfine.com/wp-content/uploads/2023/08/Toolsfine-logo-day-0531-80x320-1.webp" alt="Featured on ToolsFine.com" width={80} height={24} className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://dang.ai/" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png" alt="Dang.ai" width={150} height={54} className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://fwfw.app/item/photo-to-circle-crop" target="_blank" rel="noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://fwfw.app/badge-black.svg" width={250} height={54} alt="Featured on FWFW" className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://www.buildway.cc" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://www.buildway.cc/logo-dark.png" alt="Listed on BuildWay" className="h-6 w-auto shrink-0" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://www.ontoplist.com/software-blogs/" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:scale-105">
        <img src="https://www.ontoplist.com/images/ontoplist31.png?id=69dbb7fa3dbbb" alt="Software Development Blogs - OnToplist.com" className="h-6 w-auto shrink-0" />
      </a>
    </div>
  );
}

export default SiteFooter;
