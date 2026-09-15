import { cn } from '@/lib/utils';

interface HeaderSectionProps {
  id?: string;
  title?: string;
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  titleClassName?: string;
  subtitle?: string;
  subtitleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  subtitleClassName?: string;
  description?: string;
  descriptionAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  descriptionClassName?: string;
  /** center = symmetric sections; start = left-copy / two-column layouts */
  align?: 'center' | 'start';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Section heading block. Use align="start" above left-aligned content.
 */
export function HeaderSection({
  id,
  title,
  titleAs = 'h2',
  titleClassName,
  subtitle,
  subtitleAs = 'p',
  subtitleClassName,
  description,
  descriptionAs = 'p',
  descriptionClassName,
  align = 'center',
  className,
  children,
}: HeaderSectionProps) {
  const TitleComponent = titleAs;
  const SubtitleComponent = subtitleAs;
  const DescriptionComponent = descriptionAs;
  const isStart = align === 'start';

  return (
    <div
      id={id}
      className={cn(
        'flex flex-col gap-3 md:gap-4',
        isStart ? 'items-start text-left' : 'items-center text-center',
        className
      )}
    >
      {title ? (
        <TitleComponent
          className={cn(
            'text-xs font-semibold tracking-[0.14em] text-primary uppercase sm:text-sm',
            titleClassName
          )}
        >
          {title}
        </TitleComponent>
      ) : null}
      {subtitle ? (
        <SubtitleComponent
          className={cn(
            'text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl',
            isStart && 'max-w-xl',
            subtitleClassName
          )}
        >
          {subtitle}
        </SubtitleComponent>
      ) : null}
      {description ? (
        <DescriptionComponent
          className={cn(
            'text-balance text-base text-muted-foreground md:text-lg',
            isStart ? 'max-w-lg' : 'max-w-2xl',
            descriptionClassName
          )}
        >
          {description}
        </DescriptionComponent>
      ) : null}

      {children}
    </div>
  );
}
