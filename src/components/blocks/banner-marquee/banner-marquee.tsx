'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { HeaderSection } from '@/components/layout/header-section';
import {
  SectionShell,
  sectionStackClass,
} from '@/components/layout/section-shell';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react';

type SceneKey = 'concept' | 'newStyle' | 'dark' | 'retro';

const SCENES: ReadonlyArray<{ key: SceneKey; src: string }> = [
  { key: 'concept', src: '/banner/mp4tourl-og-concept-03-1200x630.jpg' },
  { key: 'newStyle', src: '/banner/mp4tourl-og-new-style-1200x630.jpg' },
  { key: 'dark', src: '/banner/mp4tourl-og-dark-1200x630.jpg' },
  { key: 'retro', src: '/banner/mp4tourl-og-style-retro-disc-1200x630.jpg' },
];

const DRAG_THRESHOLD_PX = 8;
const RESUME_AFTER_DRAG_MS = 1800;

function wrapMarqueeOffset(offset: number, halfWidth: number): number {
  if (halfWidth <= 0) return offset;
  let next = offset;
  while (next <= -halfWidth) next += halfWidth;
  while (next > 0) next -= halfWidth;
  return next;
}

function SceneCard({
  src,
  title,
  description,
}: {
  src: string;
  title: string;
  description: string;
}) {
  return (
    <article className="w-[300px] shrink-0 overflow-hidden rounded-xl border bg-card shadow-sm sm:w-[340px] md:w-[380px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        draggable={false}
        className="aspect-[1200/630] w-full object-cover object-center"
      />
      <div className="space-y-1.5 p-4 md:p-5">
        <h3 className="text-lg font-semibold tracking-tight leading-snug">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
    </article>
  );
}

/**
 * Homepage banner scenes — same pattern as editstamp ElectronicSealScenesMarquee
 * (title + subtitle + drag-friendly infinite strip with image/title/body cards).
 */
export default function BannerMarqueeSection() {
  const t = useTranslations('HomePage.bannerShowcase');
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startOffset: number;
    moved: boolean;
    axis: 'none' | 'x' | 'y';
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffset: 0,
    moved: false,
    axis: 'none',
  });
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const applyOffset = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const halfWidth = track.scrollWidth / 2;
    const wrapped = wrapMarqueeOffset(next, halfWidth);
    offsetRef.current = wrapped;
    track.style.transform = `translate3d(${wrapped}px,0,0)`;
  };

  const scheduleResume = (delayMs: number) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setPaused(false);
    }, delayMs);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const speed = 0.75;
    const tick = () => {
      if (!pausedRef.current) {
        applyOffset(offsetRef.current - speed);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pauseForPointer = (pointerType: string) => {
    if (pointerType === 'mouse' && dragRef.current.pointerId == null) {
      setPaused(true);
    }
  };
  const resumeForPointer = (pointerType: string) => {
    if (pointerType === 'mouse' && dragRef.current.pointerId == null) {
      setPaused(false);
    }
  };

  const endDrag = (pointerId: number) => {
    const drag = dragRef.current;
    if (drag.pointerId !== pointerId) return;
    const wasMoved = drag.moved;
    drag.pointerId = null;
    drag.axis = 'none';
    setDragging(false);
    if (wasMoved) {
      scheduleResume(RESUME_AFTER_DRAG_MS);
      window.setTimeout(() => {
        if (dragRef.current.pointerId == null) {
          dragRef.current.moved = false;
        }
      }, 0);
    } else {
      setPaused(false);
      drag.moved = false;
    }
  };

  const onViewportPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const drag = dragRef.current;
    drag.pointerId = e.pointerId;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.startOffset = offsetRef.current;
    drag.moved = false;
    drag.axis = 'none';
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setPaused(true);
  };

  const onViewportPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (drag.axis === 'none') {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
        return;
      }
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.axis = 'y';
        drag.pointerId = null;
        setPaused(false);
        return;
      }
      drag.axis = 'x';
      drag.moved = true;
      setDragging(true);
      try {
        viewportRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    if (drag.axis !== 'x') return;
    e.preventDefault();
    applyOffset(drag.startOffset + dx);
  };

  const onViewportPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    try {
      if (viewportRef.current?.hasPointerCapture(e.pointerId)) {
        viewportRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    endDrag(e.pointerId);
  };

  const onViewportClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.moved) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current.moved = false;
  };

  const loopItems = [...SCENES, ...SCENES];

  return (
    <SectionShell id="banner-showcase" tone="muted">
      <div className={sectionStackClass}>
        <ScrollReveal>
          <HeaderSection
            title={t('title')}
            titleAs="p"
            subtitle={t('subtitle')}
            subtitleAs="h2"
            description={t('description')}
            descriptionAs="p"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.08} y={24}>
          <div
            ref={viewportRef}
            className={cn(
              'relative overflow-x-hidden overflow-y-visible rounded-2xl border bg-muted/30 py-5 touch-pan-y sm:py-6',
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            onPointerEnter={(e) => pauseForPointer(e.pointerType)}
            onPointerLeave={(e) => resumeForPointer(e.pointerType)}
            onPointerDown={onViewportPointerDown}
            onPointerMove={onViewportPointerMove}
            onPointerUp={onViewportPointerUp}
            onPointerCancel={onViewportPointerUp}
            onClickCapture={onViewportClickCapture}
          >
            <div
              ref={trackRef}
              className={cn(
                'flex w-max items-stretch gap-4 px-4 will-change-transform sm:gap-5 sm:px-5',
                dragging && 'pointer-events-none'
              )}
            >
              {loopItems.map((item, index) => (
                <SceneCard
                  key={`${item.key}-${index}`}
                  src={item.src}
                  title={t(`items.${item.key}.title`)}
                  description={t(`items.${item.key}.description`)}
                />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-2xl bg-gradient-to-r from-muted/80 to-transparent sm:w-12" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-2xl bg-gradient-to-l from-muted/80 to-transparent sm:w-12" />
          </div>
        </ScrollReveal>
      </div>
    </SectionShell>
  );
}
