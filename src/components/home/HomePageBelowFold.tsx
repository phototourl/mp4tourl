"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Copy,
  Link2,
  Rocket,
  ShieldCheck,
  ClipboardPaste,
  Cloud,
  Sparkles,
  Ticket,
  FileText,
  Headset,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { LocaleLink } from "@/i18n/navigation";
import { ScrollButtons } from "@/components/shared/ScrollButtons";

const LOGO_SHOWCASE_SRC = "/projects/light1024logo.png";

const HOME_PREMIUM_H2 =
  "text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl sm:leading-tight";
const HOME_PREMIUM_LEAD =
  "mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-base";
const HOME_ROW_CARD =
  "flex items-start gap-4 rounded-2xl bg-white px-5 py-5 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 sm:px-6 sm:py-6";
const HOME_ROW_ICON =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100/80";

/** 首页首屏以下区块：单独打包，减轻移动端首包体积与主线程解析 */
export default function HomePageBelowFold() {
  const locale = useLocale() as string;
  const t = useTranslations("home");
  const tImages = useTranslations("images");
  const isRTL = locale === "ar";
  const reduceMotion = useReducedMotion();
  const homeInView = { once: true, amount: 0.14, margin: "0px 0px -5% 0px" } as const;
  const homeEase = [0.16, 1, 0.3, 1] as [number, number, number, number];
  const homeTween = (delay = 0) => ({
    type: "tween" as const,
    duration: reduceMotion ? 0 : 0.7,
    ease: homeEase,
    delay: reduceMotion ? 0 : delay,
  });

  return (
    <>
      <div className="bg-white">
        <section className="relative overflow-hidden bg-slate-50/80 py-20 lg:py-24">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(20,184,166,0.07),transparent_55%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-6 lg:max-w-7xl lg:px-10">
            <motion.div
              className="text-center"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={homeInView}
              transition={homeTween(0)}
            >
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {t("how.title")}
              </h2>
            </motion.div>

            <motion.div
              className="mx-auto mt-10 w-full max-w-[820px]"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={homeInView}
              transition={homeTween(0.04)}
            >
              <Image
                src="/og-image.png"
                alt={tImages("howIllustrationAlt")}
                width={1200}
                height={630}
                sizes="(max-width: 768px) 92vw, (max-width: 1200px) 78vw, 820px"
                className="mx-auto block h-auto w-full rounded-xl object-contain shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]"
                loading="lazy"
                unoptimized
              />
            </motion.div>

            <div className="relative mx-auto mt-8 max-w-4xl sm:mt-14">
              <div
                className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-5 hidden h-px bg-gradient-to-r from-transparent via-teal-300/70 to-transparent sm:block"
                aria-hidden
              />
              <ol className="grid gap-4 sm:grid-cols-3 sm:gap-6 lg:gap-10">
                {[t("how.step1"), t("how.step2"), t("how.step3")].map((step, i) => (
                  <motion.li
                    key={i}
                    className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center"
                    initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={homeInView}
                    transition={homeTween(0.08 + i * 0.06)}
                  >
                    <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white sm:h-10 sm:w-10">
                      {i + 1}
                    </span>
                    <p className="min-w-0 flex-1 pt-0.5 text-sm leading-relaxed text-slate-700 sm:mt-4 sm:flex-none sm:text-[0.95rem] sm:leading-relaxed">
                      {step.replace(/^\d+[).、．]\s*/, "")}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </div>

            <motion.p
              className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:mt-12 sm:text-base"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={homeInView}
              transition={homeTween(0.22)}
            >
              {t("how.note")}
            </motion.p>
          </div>
        </section>

        <section className="pb-16 pt-14 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-6xl px-6 lg:max-w-7xl lg:px-10">
            <div className="space-y-10">
              <motion.div
                initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={homeInView}
                transition={homeTween(0)}
              >
                <h2 className={HOME_PREMIUM_H2}>{t("benefits.title")}</h2>
                <p className={HOME_PREMIUM_LEAD}>{t("benefits.subtitle")}</p>
              </motion.div>
              <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3 lg:gap-5">
                {[
                  {
                    title: t("benefits.items.fast.title"),
                    desc: t("benefits.items.fast.desc"),
                    icon: Rocket,
                  },
                  {
                    title: t("benefits.items.direct.title"),
                    desc: t("benefits.items.direct.desc"),
                    icon: Link2,
                  },
                  {
                    title: t("benefits.items.nosignup.title"),
                    desc: t("benefits.items.nosignup.desc"),
                    icon: ShieldCheck,
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      className={HOME_ROW_CARD}
                      initial={{
                        opacity: reduceMotion ? 1 : 0,
                        y: reduceMotion ? 0 : 24,
                      }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={homeInView}
                      transition={homeTween(0.05 + i * 0.1)}
                    >
                      <div className={HOME_ROW_ICON}>
                        <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1 text-start">
                        <h3 className="text-base font-semibold tracking-tight text-slate-900 sm:text-[1.05rem]">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6 lg:max-w-7xl lg:px-10">
            <div className="space-y-10">
              <motion.div
                initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={homeInView}
                transition={homeTween(0)}
              >
                <h2 className={HOME_PREMIUM_H2}>{t("testimonials.title")}</h2>
                <p className={HOME_PREMIUM_LEAD}>{t("testimonials.subtitle")}</p>
              </motion.div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {[
                  {
                    name: t("testimonials.items.ops.name"),
                    quote: t("testimonials.items.ops.quote"),
                    Icon: Ticket,
                  },
                  {
                    name: t("testimonials.items.content.name"),
                    quote: t("testimonials.items.content.quote"),
                    Icon: FileText,
                  },
                  {
                    name: t("testimonials.items.support.name"),
                    quote: t("testimonials.items.support.quote"),
                    Icon: Headset,
                  },
                ].map((row, i) => {
                  const RoleIcon = row.Icon;
                  return (
                    <motion.figure
                      key={row.name}
                      className="relative flex h-full flex-col rounded-2xl bg-white px-6 py-7 text-start shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 sm:px-7 sm:py-8"
                      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 32 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={homeInView}
                      transition={homeTween(0.04 + i * 0.1)}
                    >
                      <blockquote className="flex-1 text-[0.95rem] leading-relaxed text-slate-700">
                        {row.quote}
                      </blockquote>
                      <figcaption className="mt-7 flex items-center gap-3 border-t border-slate-100 pt-5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                          <RoleIcon className="h-[18px] w-[18px]" aria-hidden strokeWidth={1.75} />
                        </span>
                        <span className="text-sm font-semibold tracking-tight text-slate-900">
                          {row.name}
                        </span>
                      </figcaption>
                    </motion.figure>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white pb-24 pt-8 lg:pb-32 lg:pt-12">
          <div className="mx-auto max-w-6xl px-6 lg:max-w-7xl lg:px-10">
            <div className="space-y-10">
              <motion.div
                initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={homeInView}
                transition={homeTween(0)}
              >
                <h2 className={HOME_PREMIUM_H2}>{t("features.title")}</h2>
                <p className={HOME_PREMIUM_LEAD}>{t("features.subtitle")}</p>
              </motion.div>
              <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-5">
                {(
                  [
                    { title: t("features.items.cdn.title"), desc: t("features.items.cdn.desc"), icon: Link2 },
                    { title: t("features.items.save.title"), desc: t("features.items.save.desc"), icon: Copy },
                    { title: t("features.items.clipboard.title"), desc: t("features.items.clipboard.desc"), icon: ClipboardPaste },
                    { title: t("features.items.errors.title"), desc: t("features.items.errors.desc"), icon: ShieldCheck },
                    { title: t("features.items.nosignup.title"), desc: t("features.items.nosignup.desc"), icon: Sparkles },
                    { title: t("features.items.r2.title"), desc: t("features.items.r2.desc"), icon: Cloud },
                  ] as const
                ).map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      className={HOME_ROW_CARD}
                      initial={{
                        opacity: reduceMotion ? 1 : 0,
                        y: reduceMotion ? 0 : 20,
                      }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={homeInView}
                      transition={homeTween(0.03 + i * 0.065)}
                    >
                      <div className={HOME_ROW_ICON}>
                        <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1 text-start">
                        <h3 className="text-base font-semibold tracking-tight text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section
        className="w-full overflow-hidden bg-white"
        aria-labelledby="longform-heading"
      >
        <div className="px-6 pt-12 pb-10 sm:pt-14 sm:pb-12 lg:pt-16 lg:pb-14">
          <motion.div
            className="mx-auto max-w-3xl rounded-[1.25rem] bg-white px-8 py-10 text-center shadow-[0_12px_48px_-16px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 sm:px-12 sm:py-12"
            initial={{
              opacity: reduceMotion ? 1 : 0,
              y: reduceMotion ? 0 : 40,
              scale: reduceMotion ? 1 : 0.97,
            }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={homeInView}
            transition={homeTween(0)}
          >
            <h2 id="longform-heading" className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {t("longform.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {t("longform.p1")}
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {t("longform.p2")}
            </p>
          </motion.div>

          <div className="mx-auto mt-6 flex max-w-4xl flex-col gap-6 sm:mt-8 sm:gap-8">
            <motion.div
              className="rounded-[1.25rem] bg-white p-8 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 sm:p-10"
              initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : isRTL ? 24 : -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={homeInView}
              transition={homeTween(0.05)}
            >
              <h3 className="text-xl font-semibold text-slate-900">{t("longform.useCases.title")}</h3>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400 sm:text-base">
                <li>{t("longform.useCases.items.1")}</li>
                <li>{t("longform.useCases.items.2")}</li>
                <li>{t("longform.useCases.items.3")}</li>
                <li>{t("longform.useCases.items.4")}</li>
                <li>{t("longform.useCases.items.5")}</li>
                <li>{t("longform.useCases.items.6")}</li>
              </ul>
            </motion.div>
            <motion.div
              className="rounded-[1.25rem] bg-white p-8 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 sm:p-10"
              initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : isRTL ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={homeInView}
              transition={homeTween(0.08)}
            >
              <h3 className="text-xl font-semibold text-slate-900">{t("longform.flow.title")}</h3>
              <div className="mt-4 space-y-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base">
                  {t("longform.flow.p1")}
                </p>
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{t("longform.flow.p2")}</p>
              </div>
            </motion.div>
            <motion.div
              className="rounded-[1.25rem] bg-white p-8 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 sm:p-10"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={homeInView}
              transition={homeTween(0)}
            >
              <h3 className="text-xl font-semibold text-slate-900">{t("longform.best.title")}</h3>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400 sm:text-base">
                <li>{t("longform.best.items.1")}</li>
                <li>{t("longform.best.items.2")}</li>
                <li>{t("longform.best.items.3")}</li>
                <li>{t("longform.best.items.6")}</li>
              </ul>
            </motion.div>
            <motion.div
              className="rounded-[1.25rem] bg-white p-8 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 sm:p-10"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={homeInView}
              transition={homeTween(0.1)}
            >
              <h3 className="text-xl font-semibold text-slate-900">{t("longform.roadmap.title")}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{t("longform.roadmap.p1")}</p>
            </motion.div>
            <motion.div
              className="rounded-[1.25rem] bg-white p-8 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 sm:p-10"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={homeInView}
              transition={homeTween(0)}
            >
              <h3 className="text-xl font-semibold text-slate-900">{t("longform.faq.title")}</h3>
              <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-600 sm:text-base">
                <div>
                  <p className="font-semibold text-slate-900">{t("longform.faq.items.1.q")}</p>
                  <p className="mt-1.5 text-slate-600">{t("longform.faq.items.1.a")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t("longform.faq.items.2.q")}</p>
                  <p className="mt-1.5 text-slate-600">{t("longform.faq.items.2.a")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t("longform.faq.items.3.q")}</p>
                  <p className="mt-1.5 text-slate-600">{t("longform.faq.items.3.a")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t("longform.faq.items.4.q")}</p>
                  <p className="mt-1.5 text-slate-600">{t("longform.faq.items.4.a")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t("longform.faq.items.5.q")}</p>
                  <p className="mt-1.5 text-slate-600">{t("longform.faq.items.5.a")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t("longform.faq.items.6.q")}</p>
                  <p className="mt-1.5 text-slate-600">{t("longform.faq.items.6.a")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t("longform.faq.items.7.q")}</p>
                  <p className="mt-1.5 text-slate-600">{t("longform.faq.items.7.a")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t("longform.faq.items.8.q")}</p>
                  <p className="mt-1.5 text-slate-600">{t("longform.faq.items.8.a")}</p>
                </div>
                <p className="border-t border-slate-100 pt-5 text-slate-600">
                  {t.rich("longform.faq.contactNote", {
                    contactLink: (chunks) => (
                      <LocaleLink
                        href="/contact"
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {chunks}
                      </LocaleLink>
                    ),
                    email: (chunks) => (
                      <a
                        href="mailto:support@phototourl.com"
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              </div>
            </motion.div>
            <motion.section
              className="rounded-[1.25rem] bg-white p-8 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 sm:p-10"
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={homeInView}
              transition={homeTween(0.08)}
              aria-labelledby="home-about-heading"
            >
              <div
                className={`flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10 lg:gap-12 ${isRTL ? "sm:flex-row-reverse" : ""}`}
              >
                <motion.div
                  className="flex shrink-0 justify-center"
                  initial={{
                    opacity: reduceMotion ? 1 : 0,
                    x: reduceMotion ? 0 : isRTL ? 12 : -12,
                  }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={homeInView}
                  transition={homeTween(0.12)}
                >
                  <Image
                    src={LOGO_SHOWCASE_SRC}
                    alt="Photo To URL logo"
                    width={176}
                    height={176}
                    sizes="(max-width: 640px) 120px, 176px"
                    className="h-28 w-auto object-contain sm:h-36 md:h-40"
                    loading="lazy"
                    unoptimized
                  />
                </motion.div>
                <div className="min-w-0 flex-1 text-center">
                  <h2
                    id="home-about-heading"
                    className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
                  >
                    {t("longform.about.title")}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {t("longform.about.p1")}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {t("longform.about.p2")}
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </section>

      <ScrollButtons />
    </>
  );
}
