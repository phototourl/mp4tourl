'use client';

import VideoUpload from '@/components/blocks/hero/video-upload';
import { TextEffect } from '@/components/tailark/motion/text-effect';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const MOBILE_MQ = '(max-width: 767px)';

function isMobileViewport() {
  return window.matchMedia(MOBILE_MQ).matches;
}

/**
 * Hero OG art: split → capsule drops (transform, not top/height) → merge → scroll.
 *
 * Root cause of prior mobile “flash ~1s, no drop”:
 * CSS `transition` on `top` / `height` is layout-bound and often jumps on mobile
 * WebKit (Paul Irish / Safari guidance: animate transform/opacity only). Users
 * only saw the ~1.1s merge transform. Capsule now uses measured translateY via
 * motion/react so the top→bottom path actually runs on phones.
 */
export default function HeroSection() {
  const t = useTranslations('HomePage.hero');
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'sliding' | 'merged'>('idle');
  const [artReady, setArtReady] = useState(false);
  const [travelY, setTravelY] = useState(0);
  const [ballSize, setBallSize] = useState(56);
  const [isMobile, setIsMobile] = useState(false);
  const startedRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const trackRef = useRef<HTMLSpanElement>(null);
  const imagesLoadedRef = useRef(0);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const queueTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const measureTrack = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const height = track.clientHeight;
    const width = track.clientWidth;
    if (height < 8 || width < 8) return;
    // Ball is aspect-square spanning track width
    setBallSize(width);
    setTravelY(Math.max(0, height - width));
  }, []);

  useLayoutEffect(() => {
    measureTrack();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureTrack());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measureTrack, artReady]);

  const onArtLoad = useCallback(() => {
    imagesLoadedRef.current += 1;
    if (imagesLoadedRef.current >= 1) {
      setArtReady(true);
      // Layout after image decode
      requestAnimationFrame(() => measureTrack());
    }
  }, [measureTrack]);

  const scrollToUpload = useCallback(() => {
    const el = document.getElementById('upload');
    if (!el) return;
    const mobile = isMobileViewport();
    if (!mobile) {
      const rect = el.getBoundingClientRect();
      const alreadyInView =
        rect.top >= 0 &&
        rect.top < window.innerHeight * 0.45 &&
        rect.bottom > window.innerHeight * 0.25;
      if (alreadyInView) return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const runSequence = useCallback(() => {
    if (startedRef.current) return;
    if (travelY <= 0) return;
    startedRef.current = true;

    const mobile = isMobileViewport();
    // Drop duration must match motion transition below
    const dropMs = mobile ? 2200 : 1100;
    const holdAfterDropMs = mobile ? 500 : 300;
    const mergeCssMs = mobile ? 1100 : 700;
    const scrollAfterMergeMs = mobile ? 900 : 700;

    // Ensure idle styles are committed before flipping to sliding (Safari)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase('sliding');
        queueTimeout(() => setPhase('merged'), dropMs + holdAfterDropMs);
        queueTimeout(
          scrollToUpload,
          dropMs + holdAfterDropMs + mergeCssMs + scrollAfterMergeMs
        );
      });
    });
  }, [travelY, queueTimeout, scrollToUpload]);

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
    setIsMobile(isMobileViewport());

    // Cached images may skip onLoad in some WebViews — fail-safe start
    const readyFallback = window.setTimeout(() => setArtReady(true), 1800);
    return () => window.clearTimeout(readyFallback);
  }, []);

  useEffect(() => {
    // useReducedMotion is null until mounted — wait so we don't flash then skip
    if (reduceMotion === null) return;

    if (reduceMotion) {
      startedRef.current = true;
      setPhase('merged');
      queueTimeout(scrollToUpload, isMobileViewport() ? 500 : 350);
      return;
    }

    if (!artReady || travelY <= 0 || startedRef.current) return;

    const mobile = isMobileViewport();
    const delayId = window.setTimeout(runSequence, mobile ? 400 : 600);

    return () => {
      window.clearTimeout(delayId);
    };
  }, [
    artReady,
    travelY,
    reduceMotion,
    runSequence,
    queueTimeout,
    scrollToUpload,
  ]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const split = phase !== 'merged';
  // Keep capsule at bottom while track fades out on merge
  const sliding = phase === 'sliding' || phase === 'merged';
  const dropDuration = isMobile ? 2.2 : 1.1;
  const fillScale =
    ballSize > 0 && travelY + ballSize > 0
      ? sliding
        ? 1
        : ballSize / (travelY + ballSize)
      : sliding
        ? 1
        : 0.12;

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

          <div className="relative mx-auto mt-12 max-w-4xl px-8 sm:px-10 md:mt-14 md:px-0">
            <div
              aria-hidden
              className="relative isolate block w-full select-none overflow-visible rounded-sm"
            >
              <div
                className={cn(
                  'relative z-[1] will-change-transform ease-out',
                  'transition-transform duration-[1100ms] md:duration-700',
                  split &&
                    '-translate-x-8 [filter:drop-shadow(4px_0_8px_rgba(0,0,0,0.16))]'
                )}
              >
                <Image
                  src="/og.jpg"
                  alt={t('tagline')}
                  width={1200}
                  height={630}
                  priority
                  onLoad={onArtLoad}
                  className="h-auto w-full object-contain [clip-path:inset(0_50%_0_0)]"
                  sizes="(max-width: 768px) 100vw, 1024px"
                />
              </div>

              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-0 z-[1] will-change-transform ease-out',
                  'transition-transform duration-[1100ms] md:duration-700',
                  split &&
                    'translate-x-8 [filter:drop-shadow(-4px_0_8px_rgba(0,0,0,0.16))]'
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

              {/* Mid track — transform-only drop (mobile-safe) */}
              <motion.span
                ref={trackRef}
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-y-0 left-1/2 z-0 w-14 sm:w-16',
                  '-translate-x-1/2'
                )}
                animate={{ opacity: phase === 'merged' ? 0 : 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
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

                {/* Graffiti fill grows via scaleY (compositor), not height */}
                <span className="absolute inset-x-0 top-0 h-full overflow-hidden rounded-b-full">
                  <motion.span
                    className="block h-full w-full origin-top will-change-transform"
                    initial={false}
                    animate={{ scaleY: fillScale }}
                    transition={{
                      duration: dropDuration,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      backgroundImage: 'url(/wise-track-graffiti.svg)',
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center top',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                </span>

                {/* Capsule — translateY in px from measured track */}
                <motion.span
                  className={cn(
                    'absolute left-0 right-0 top-0 z-[1] flex aspect-square items-center justify-center',
                    'rounded-full bg-[#d5d5d5] will-change-transform',
                    'shadow-[0_2px_4px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.55)]'
                  )}
                  initial={false}
                  animate={{ y: sliding ? travelY : 0 }}
                  transition={{
                    duration: dropDuration,
                    ease: [0.22, 1, 0.36, 1],
                  }}
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
                </motion.span>
              </motion.span>

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
