'use client';

import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { useFooterLinks } from '@/config/footer-config';
import { useSocialLinks } from '@/config/social-config';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type React from 'react';

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = useTranslations();
  const footerLinks = useFooterLinks();
  const socialLinks = useSocialLinks();

  return (
    <footer className={cn('border-t', className)}>
      <Container className="px-4">
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-6">
          <div className="flex flex-col items-start col-span-full md:col-span-2">
            <div className="space-y-4">
              {/* logo and name */}
              <div className="flex items-center space-x-2">
                <Logo />
                <span className="text-xl font-semibold">
                  {t('Metadata.name')}
                </span>
              </div>

              {/* tagline */}
              <p className="text-muted-foreground text-base py-2 md:pr-12">
                {t('Marketing.footer.tagline')}
              </p>

              {/* social links */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  {socialLinks?.map((link) => (
                    <a
                      key={link.title}
                      href={link.href || '#'}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.title}
                      className="border border-border inline-flex h-8 w-8 items-center
                          justify-center rounded-full hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="sr-only">{link.title}</span>
                      {link.icon ? link.icon : null}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* footer links */}
          {footerLinks?.map((section) => (
            <div
              key={section.title}
              className="col-span-1 md:col-span-1 items-start"
            >
              <span className="text-sm font-semibold uppercase">
                {section.title}
              </span>
              <ul className="mt-4 list-inside space-y-3">
                {section.items?.map(
                  (item) =>
                    item.href && (
                      <li key={item.title}>
                        <LocaleLink
                          href={item.href || '#'}
                          target={item.external ? '_blank' : undefined}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {item.title}
                        </LocaleLink>
                      </li>
                    )
                )}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* Badge row: 移动端跑马灯，PC 单行静态不滚动、不换行 */}
      <div role="region" aria-label="Partner badges">
        <div className="overflow-hidden md:hidden px-4 py-6">
          <div className="mtu-badge-marquee-track">
            <FooterBadgeGroup />
            <FooterBadgeGroup ariaHidden />
          </div>
        </div>
        <div className="hidden md:block overflow-hidden px-4 py-6">
          <div className="flex justify-center">
            <FooterBadgeGroup />
          </div>
        </div>
      </div>

      <div className="border-t border-foreground/10 py-4">
        <Container className="px-4 text-center">
          <span className="text-muted-foreground text-sm">
            {t('Marketing.footer.copyright', {
              year: new Date().getFullYear(),
            })}
          </span>
        </Container>
      </div>
    </footer>
  );
}

function FooterBadgeGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex w-max flex-nowrap items-center gap-3 pr-3"
      aria-hidden={ariaHidden || undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://www.producthunt.com/products/mp4tourl?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-mp4tourl"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block shrink-0 no-underline transition-transform hover:scale-105"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1253034&theme=light&t=1789625626126"
          alt="MP4toURL - Upload a video. Get a permanent shareable URL. | Product Hunt"
          width={250}
          height={54}
          className="h-6 w-auto shrink-0"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://fazier.com/launches/mp4tourl.com"
        target="_blank"
        rel="noreferrer"
        className="inline-block shrink-0 no-underline transition-transform hover:scale-105"
      >
        <img
          src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light"
          width={120}
          height={28}
          alt="Fazier badge"
          className="h-6 w-auto opacity-90 hover:opacity-100 transition-opacity shrink-0"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://dang.ai"
        target="_blank"
        rel="noopener"
        className="inline-block shrink-0 no-underline transition-transform hover:scale-105"
      >
        <img
          src="https://assets.dang.ai/badges/dang-verified-dark.png"
          alt="Verified on DANG!"
          width={260}
          height={94}
          className="h-6 w-auto shrink-0"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://fwfw.app/item/mp4tourl"
        target="_blank"
        rel="noreferrer"
        className="inline-block shrink-0 no-underline transition-transform hover:scale-105"
      >
        <img
          src="https://fwfw.app/badge-white.svg"
          width={250}
          height={54}
          alt="Featured on FWFW"
          className="h-6 w-auto shrink-0"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://showmebest.ai"
        target="_blank"
        rel="noreferrer"
        className="inline-block shrink-0 no-underline transition-transform hover:scale-105"
      >
        <img
          src="https://showmebest.ai/badge/feature-badge-white.webp"
          alt="Featured on ShowMeBestAI"
          width={220}
          height={60}
          className="h-6 w-auto shrink-0"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://submitaitools.org"
        target="_blank"
        rel="noreferrer"
        className="inline-block shrink-0 no-underline transition-transform hover:scale-105"
      >
        <img
          src="https://submitaitools.org/static_submitaitools/images/submitaitools.png"
          alt="Submit AI Tools"
          width={200}
          height={60}
          className="h-6 w-auto rounded-[10px] shrink-0"
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href="https://twelve.tools"
        target="_blank"
        rel="noreferrer"
        className="inline-block shrink-0 no-underline transition-transform hover:scale-105"
      >
        <img
          src="https://twelve.tools/badge0-white.svg"
          alt="Featured on Twelve Tools"
          width={148}
          height={40}
          className="h-6 w-auto shrink-0"
        />
      </a>
    </div>
  );
}
