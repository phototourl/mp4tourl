'use client';

import VideoUpload from '@/components/blocks/hero/video-upload';
import { TextEffect } from '@/components/tailark/motion/text-effect';
import { cn } from '@/lib/utils';
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

type Phase = 'idle' | 'sliding' | 'merged';

/**
 * Hero split + capsule drop + merge.
 *
 * Why mobile kept failing (flash ~1s, no top→bottom):
 * 1) Capsule track was z-0 UNDER the clipped images (z-1). Desktop gap
 *    revealed it; mobile compositing/clip-path often hid the whole drop —
 *    users only saw the merge transform (~1s).
 * 2) Animating `top`/`height` jumps on mobile WebKit; must use transform.
 * 3) Capsule drop uses CSS keyframes on translate3d (globals.css).
 */
export default function HeroSection() {
  const t = useTranslations('HomePage.hero');
  const [phase, setPhase] = useState<Phase>('idle');
  const [travelY, setTravelY] = useState(0);
  const [dropSeconds, setDropSeconds] = useState(1.2);
  const startedRef = useRef(false);
  const scheduledRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const queue = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const h = track.clientHeight;
    const w = track.clientWidth;
    if (h < 24 || w < 16) return 0;
    const travel = Math.max(0, h - w);
    setTravelY(travel);
    return travel;
  }, []);

  useLayoutEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);

  const scrollToUpload = useCallback(() => {
    const el = document.getElementById('upload');
    if (!el) return;
    if (!isMobileViewport()) {
      const rect = el.getBoundingClientRect();
      if (
        rect.top >= 0 &&
        rect.top < window.innerHeight * 0.45 &&
        rect.bottom > window.innerHeight * 0.25
      ) {
        return;
      }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const runSequence = useCallback(
    (travel: number) => {
      if (startedRef.current || travel <= 0) return;
      startedRef.current = true;

      const mobile = isMobileViewport();
      const dropMs = mobile ? 2400 : 1200;
      const holdMs = mobile ? 450 : 280;
      const mergeMs = mobile ? 1000 : 700;
      const afterMergeMs = mobile ? 800 : 600;
      setDropSeconds(mobile ? 2.4 : 1.2);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('sliding');
          queue(() => setPhase('merged'), dropMs + holdMs);
          queue(scrollToUpload, dropMs + holdMs + mergeMs + afterMergeMs);
        });
      });
    },
    [queue, scrollToUpload]
  );

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
    setDropSeconds(isMobileViewport() ? 2.4 : 1.2);

    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    if (startedRef.current || scheduledRef.current) return;

    let cancelled = false;
    const tryStart = () => {
      if (cancelled || startedRef.current || scheduledRef.current) return;
      const travel = measure();
      if (travel <= 0) return;
      scheduledRef.current = true;
      const mobile = isMobileViewport();
      queue(() => {
        if (!cancelled) runSequence(travel);
      }, mobile ? 350 : 550);
    };

    const startId = window.setTimeout(tryStart, 200);
    const retryId = window.setTimeout(tryStart, 900);
    const lastId = window.setTimeout(tryStart, 1600);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      window.clearTimeout(retryId);
      window.clearTimeout(lastId);
    };
  }, [measure, queue, runSequence]);

  const split = phase !== 'merged';
  const sliding = phase === 'sliding' || phase === 'merged';

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
            Desktop: track ≈ 7.14% of art (64/896), half-shift ≈ 3.57%.
            Mobile: slightly larger % so the rail stays readable on a narrow
            art box (same idea, not fixed rem that overpowers the image).
          */}
          <div className="relative mx-auto mt-12 max-w-4xl px-[5%] md:mt-14 md:px-0">
            <div
              aria-hidden
              className="relative isolate block w-full select-none overflow-visible rounded-sm"
            >
              <div
                className={cn(
                  'relative z-[1] will-change-transform ease-out',
                  'transition-transform duration-1000 md:duration-700',
                  split &&
                    '-translate-x-[4.5%] [filter:drop-shadow(4px_0_8px_rgba(0,0,0,0.16))] md:-translate-x-[3.57%]'
                )}
              >
                <Image
                  src="/og.jpg"
                  alt={t('tagline')}
                  width={1200}
                  height={630}
                  priority
                  onLoad={() => {
                    requestAnimationFrame(() => measure());
                  }}
                  className="h-auto w-full object-contain [clip-path:inset(0_50%_0_0)]"
                  sizes="(max-width: 768px) 100vw, 1024px"
                />
              </div>

              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-0 z-[1] will-change-transform ease-out',
                  'transition-transform duration-1000 md:duration-700',
                  split &&
                    'translate-x-[4.5%] [filter:drop-shadow(-4px_0_8px_rgba(0,0,0,0.16))] md:translate-x-[3.57%]'
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
                z-20 so the drop is visible on mobile.
                Mobile ~9% of art width; md+ matches PC 7.14%.
              */}
              <div
                ref={trackRef}
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-y-0 left-1/2 z-20',
                  'w-[9%] md:w-[7.14%]',
                  'transition-opacity duration-500',
                  phase === 'merged' ? 'opacity-0' : 'opacity-100'
                )}
                style={{
                  transform: 'translateX(-50%)',
                  ['--capsule-travel' as string]: `${travelY}px`,
                  ['--drop-duration' as string]: `${dropSeconds}s`,
                }}
              >
                <div
                  className={cn(
                    'absolute inset-0 rounded-b-full',
                    'bg-[#0c1f12] dark:bg-[#141414]',
                    'shadow-[inset_0_3px_10px_rgba(0,0,0,0.55)]',
                    'ring-1 ring-black/15',
                    'dark:ring-white/40',
                    'dark:shadow-[inset_0_3px_10px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.22),0_4px_18px_rgba(0,0,0,0.55)]'
                  )}
                />

                <div className="absolute inset-x-0 top-0 h-full overflow-hidden rounded-b-full">
                  <div
                    className={cn(
                      'mp4-hero-fill h-full w-full',
                      sliding && 'mp4-hero-fill-run'
                    )}
                    style={{
                      backgroundImage: 'url(/wise-track-graffiti.svg)',
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center top',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                </div>

                <div
                  className={cn(
                    'mp4-hero-capsule absolute left-0 right-0 top-0 z-[1] flex aspect-square items-center justify-center',
                    'rounded-full bg-[#d5d5d5]',
                    'shadow-[0_2px_4px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.55)]',
                    sliding && 'mp4-hero-capsule-run'
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
                </div>
              </div>

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
