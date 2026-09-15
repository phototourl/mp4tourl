'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { HeaderSection } from '@/components/layout/header-section';
import {
  SectionShell,
  sectionBodyClass,
  sectionH3Class,
  sectionStackClass,
} from '@/components/layout/section-shell';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslations } from 'next-intl';

const FAQ_IDS = [
  'item-1',
  'item-2',
  'item-3',
  'item-4',
  'item-5',
  'item-6',
  'item-7',
] as const;

/**
 * FAQ — centered header + full-width accordion in the same max-w-6xl shell.
 */
export default function FaqSection() {
  const t = useTranslations('HomePage.faqs');

  return (
    <SectionShell id="faqs">
      <div className={sectionStackClass}>
        <ScrollReveal>
          <HeaderSection
            title={t('title')}
            titleAs="p"
            subtitle={t('subtitle')}
            subtitleAs="h2"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.08} y={28}>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_IDS.map((id) => (
              <AccordionItem key={id} value={id} className="border-border/60">
                <AccordionTrigger className="cursor-pointer gap-4 py-5 text-left hover:no-underline md:py-6 [&>svg]:size-5">
                  <h3 className={sectionH3Class}>
                    {t(`items.${id}.question`)}
                  </h3>
                </AccordionTrigger>
                <AccordionContent forceMount>
                  <p className={`pb-2 ${sectionBodyClass}`}>
                    {t(`items.${id}.answer`)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </SectionShell>
  );
}
