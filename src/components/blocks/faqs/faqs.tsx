'use client';

import {
  AmbientBlobs,
  ScrollReveal,
} from '@/components/motion/scroll-reveal';
import { HeaderSection } from '@/components/layout/header-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  CircleHelp,
  Film,
  Gift,
  Link2,
  Share2,
  Shield,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const FAQ_ITEMS = [
  { id: 'item-1', icon: CircleHelp },
  { id: 'item-2', icon: Workflow },
  { id: 'item-3', icon: Film },
  { id: 'item-4', icon: Link2 },
  { id: 'item-5', icon: Share2 },
  { id: 'item-6', icon: Gift },
  { id: 'item-7', icon: Shield },
] as const satisfies ReadonlyArray<{ id: string; icon: LucideIcon }>;

export default function FaqSection() {
  const t = useTranslations('HomePage.faqs');

  return (
    <section
      id="faqs"
      className="relative scroll-mt-16 overflow-hidden px-4 py-20 md:py-24"
    >
      <AmbientBlobs />
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <HeaderSection
            title={t('title')}
            titleAs="h2"
            subtitle={t('subtitle')}
            subtitleAs="p"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.1} y={32} className="mx-auto mt-12 max-w-4xl md:mt-14">
          <div
            className={cn(
              'overflow-hidden rounded-2xl border border-border/80',
              'bg-muted/30 shadow-sm',
              'dark:border-border dark:bg-muted/20'
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-2.5 sm:px-6">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                MP4TOURL · FAQ
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                <span
                  className="size-1.5 rounded-full bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.55)]"
                  aria-hidden
                />
                Spec
              </span>
            </div>

            <Accordion
              type="single"
              collapsible
              className="w-full px-3 sm:px-4"
            >
              {FAQ_ITEMS.map(({ id, icon: Icon }) => (
                <AccordionItem
                  key={id}
                  value={id}
                  className="border-border/70 last:border-b-0"
                >
                  <AccordionTrigger className="cursor-pointer gap-3 py-4 text-left text-base hover:no-underline data-[state=open]:text-foreground">
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={cn(
                          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                          'border border-border/70 bg-background/80 text-primary shadow-sm',
                          'dark:bg-background/40'
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 pt-1.5 leading-snug">
                        {t(`items.${id}.question`)}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="pb-1 pl-12 text-base leading-relaxed text-muted-foreground">
                      {t(`items.${id}.answer`)}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
