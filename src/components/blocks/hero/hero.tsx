'use client';

import VideoUpload from '@/components/blocks/hero/video-upload';
import { TextEffect } from '@/components/tailark/motion/text-effect';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hero: left/right = clipped og.jpg; mid = Wise capsule track.
 * F5 starts at top; after load → auto slide → merge → scroll to #upload.
 * Mobile-only: narrower gap/track. Do NOT pad the art root (breaks L/R align).
 */
export default function HeroSection() {
  const t = useTranslations('HomePage.hero');
  const [phase, setPhase] = useState<'idle' | 'sliding' | 'merged'>('idle');
  const startedRef = useRef(false);

  const runSequence = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase('sliding');
    window.setTimeout(() => setPhase('merged'), 1200);
    window.setTimeout(() => {
      const el = document.getElementById('upload');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const alreadyInView =
        rect.top < window.innerHeight * 0.72 && rect.bottom > 0;
      if (alreadyInView) return;
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      el.scrollIntoView({
        behavior: 'smooth',
        block: mobile ? 'nearest' : 'start',
      });
    }, 3900);
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
    window.scrollTo(0, 0);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      startedRef.current = true;
      setPhase('merged');
      return;
    }

    let delayId = 0;
    const startAfterLoad = () => {
      delayId = window.setTimeout(runSequence, 900);
    };

    if (document.readyState === 'complete') {
      startAfterLoad();
    } else {
      window.addEventListener('load', startAfterLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', startAfterLoad);
      window.clearTimeout(delayId);
    };
  }, [runSequence]);

  const split = phase !== 'merged';
  const sliding = phase === 'sliding';

  return (
    <main id="hero" className="overflow-x-clip">
      <section className="relative px-4 pt-20 pb-10 md:pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <TextEffect
              per="line"
              preset="fade-in-blur"
              speedSegment={0.3}
              as="h1"
              className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
            >
              {t('title')}
            </TextEffect>

            <TextEffect
              per="line"
              preset="fade-in-blur"
              speedSegment={0.3}
              delay={0.35}
              as="p"
              className="mt-5 text-balance text-lg text-muted-foreground md:mt-6 md:text-xl"
            >
              {t('description')}
            </TextEffect>

            <p className="mt-3 text-base text-muted-foreground/90 md:mt-4">
              {t('tagline')}
            </p>
          </div>

          {/*
            File stays 1200×630 (OG). On-page: max-w-4xl so ~896×470 —
            full image visible, not stretched to max-w-6xl (~1152×605).
          */}
          <div className="relative mx-auto mt-12 max-w-4xl md:mt-14">
            {/* No padding on this node — absolute right half must share the same box as left */}
            <div
              aria-hidden
              className="relative isolate block w-full select-none overflow-visible rounded-sm"
            >
            {/* Left clipped art */}
            <div
              className={cn(
                'relative z-[1] transition-transform duration-700 ease-out will-change-transform',
                split &&
                  '-translate-x-4 [filter:drop-shadow(3px_0_6px_rgba(0,0,0,0.14))] sm:-translate-x-8 sm:[filter:drop-shadow(4px_0_8px_rgba(0,0,0,0.16))]'
              )}
            >
              <Image
                src="/og.jpg"
                alt={t('tagline')}
                width={1200}
                height={630}
                priority
                className="h-auto w-full object-contain [clip-path:inset(0_50%_0_0)]"
                sizes="(max-width: 768px) 100vw, 1024px"
              />
            </div>

            {/* Right clipped art */}
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0 z-[1] transition-transform duration-700 ease-out will-change-transform',
                split &&
                  'translate-x-4 [filter:drop-shadow(-3px_0_6px_rgba(0,0,0,0.14))] sm:translate-x-8 sm:[filter:drop-shadow(-4px_0_8px_rgba(0,0,0,0.16))]'
              )}
            >
              <Image
                src="/og.jpg"
                alt=""
                width={1200}
                height={630}
                priority
                className="h-auto w-full object-contain [clip-path:inset(0_0_0_50%)]"
                sizes="(max-width: 768px) 100vw, 1024px"
              />
            </div>

            {/*
              Mid track — 3 layers (back → front), matching Wise.
              max-sm: narrower rail to match smaller gap.
            */}
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-y-0 left-1/2 z-0',
                '-translate-x-1/2',
                'w-10 sm:w-16',
                'transition-opacity duration-300',
                phase === 'merged' ? 'opacity-0' : 'opacity-100'
              )}
            >
              <span
                className={cn(
                  'absolute inset-0 rounded-b-full',
                  'bg-[#0c1f12] dark:bg-[#141414]',
                  'shadow-[inset_0_3px_10px_rgba(0,0,0,0.55)]',
                  'ring-1 ring-black/15',
                  'dark:ring-white/40',
                  'dark:shadow-[inset_0_3px_10px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.22),0_4px_18px_rgba(0,0,0,0.55)]'
                )}
              />

              <span
                className={cn(
                  'absolute inset-x-0 top-0 overflow-hidden',
                  'transition-[height] duration-[1100ms] ease-in-out',
                  sliding
                    ? 'h-[calc(100%-1.25rem)] sm:h-[calc(100%-2rem)]'
                    : 'h-[1.25rem] sm:h-[2rem]'
                )}
              >
                <span
                  className="block h-full min-h-[1.25rem] w-full sm:min-h-[2rem]"
                  style={{
                    backgroundImage: 'url(/wise-track-graffiti.svg)',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center top',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </span>

              <span
                className={cn(
                  'absolute left-0 right-0 z-[1] flex aspect-square items-center justify-center',
                  'rounded-full bg-[#d5d5d5]',
                  'shadow-[0_2px_4px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.55)]',
                  'transition-[top] duration-[1100ms] ease-in-out',
                  sliding
                    ? 'top-[calc(100%-2.5rem)] sm:top-[calc(100%-4rem)]'
                    : 'top-0'
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-[42%] text-black"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5 V19" />
                  <path d="M5 12 L12 19 L19 12" />
                </svg>
              </span>
            </span>

            <span className="sr-only">MP4toURL — video to link</span>
          </div>
          </div>
        </div>
      </section>

      <section
        id="upload"
        className="scroll-mt-28 px-4 pb-16 pt-6 md:pb-20 md:pt-8"
      >
        <div className="mx-auto max-w-2xl">
          <VideoUpload />
        </div>
      </section>
    </main>
  );
}
