'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type HTMLMotionProps,
} from 'motion/react';
import { useRef, type ReactNode } from 'react';

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Lenient for short mobile viewports; still fine on desktop. */
const revealViewport = {
  amount: 0.1,
  margin: '0px 0px -32px 0px',
} as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay in seconds */
  delay?: number;
  /** Slide distance in px */
  y?: number;
  once?: boolean;
};

/**
 * Scroll reveal — fade + rise when section enters view.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 20,
  once = true,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, ...revealViewport }}
      transition={{ duration: 0.45, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
  as?: 'div' | 'ol' | 'ul';
};

/** Parent for staggered children (feature rows, step cards). */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  once = true,
  as = 'div',
}: StaggerProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, ...revealViewport }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren: 0.04 },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  className,
  y = 16,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: 'div' | 'li';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, ease: easeOut },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Soft parallax on media — disabled on mobile (touch scroll + transform = jank).
 */
export function ParallaxFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const disabled = reduce || isMobile;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    disabled ? (['0%', '0%'] as const) : (['8%', '-8%'] as const)
  );

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.div
        style={{ y }}
        className={cn(!disabled && 'will-change-transform')}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Ambient floating blobs — lighter / smaller on mobile.
 */
export function AmbientBlobs({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  if (reduce) return null;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        className
      )}
    >
      <motion.div
        className={cn(
          'absolute -left-[12%] top-[10%] rounded-full bg-zinc-400/15 blur-3xl dark:bg-zinc-500/20',
          isMobile ? 'h-40 w-40' : 'h-64 w-64'
        )}
        animate={
          isMobile
            ? { x: [0, 12, 0], y: [0, 8, 0] }
            : { x: [0, 24, 0], y: [0, 18, 0] }
        }
        transition={{
          duration: isMobile ? 18 : 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={cn(
          'absolute -right-[10%] bottom-[5%] rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-400/12',
          isMobile ? 'h-44 w-44' : 'h-72 w-72'
        )}
        animate={
          isMobile
            ? { x: [0, -10, 0], y: [0, -8, 0] }
            : { x: [0, -20, 0], y: [0, -14, 0] }
        }
        transition={{
          duration: isMobile ? 20 : 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export type MotionDivProps = HTMLMotionProps<'div'>;
