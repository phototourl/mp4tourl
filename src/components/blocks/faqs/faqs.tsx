'use client';

import { HeaderSection } from '@/components/layout/header-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslations } from 'next-intl';

export default function FaqSection() {
  const t = useTranslations('HomePage.faqs');
  const ids = [
    'item-1',
    'item-2',
    'item-3',
    'item-4',
    'item-5',
    'item-6',
    'item-7',
  ] as const;

  return (
    <section id="faqs" className="scroll-mt-24 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <HeaderSection
          title={t('title')}
          titleAs="h2"
          subtitle={t('subtitle')}
          subtitleAs="p"
        />

        <div className="mx-auto mt-12 max-w-4xl">
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-2xl border px-8 py-3 shadow-sm"
          >
            {ids.map((id) => (
              <AccordionItem key={id} value={id} className="border-dashed">
                <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                  {t(`items.${id}.question`)}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-muted-foreground">
                    {t(`items.${id}.answer`)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
