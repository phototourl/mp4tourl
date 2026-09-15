import { AmbientBlobs } from '@/components/motion/scroll-reveal';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type SectionShellProps = {
  id?: string;
  /** muted = alternating band */
  tone?: 'default' | 'muted';
  className?: string;
  /** Extra classes on the max-w-6xl inner wrapper */
  innerClassName?: string;
  children: ReactNode;
};

/**
 * Homepage section frame — one width, one vertical rhythm.
 * - Outer: px-4 py-20 md:py-24, scroll-mt-28
 * - Inner: max-w-6xl
 */
export function SectionShell({
  id,
  tone = 'default',
  className,
  innerClassName,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative scroll-mt-28 overflow-hidden px-4 py-20 md:py-24',
        tone === 'muted' && 'bg-muted/40',
        className
      )}
    >
      <AmbientBlobs />
      <div className={cn('mx-auto max-w-6xl', innerClassName)}>{children}</div>
    </section>
  );
}

/** Vertical gap between header and body inside a section */
export const sectionStackClass = 'space-y-12 lg:space-y-14';

/** Shared body copy under an h3 */
export const sectionBodyClass =
  'text-sm leading-relaxed text-muted-foreground md:text-base';

/** Shared h3 in feature lists / step cards / FAQ */
export const sectionH3Class = 'text-lg font-semibold tracking-tight text-foreground';
