'use client';

import { HeaderSection } from '@/components/layout/header-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ACCENT_CLASSES = [
  'ptu-faq-kpi-primary',
  'ptu-faq-kpi-success',
  'ptu-faq-kpi-warning',
  'ptu-faq-kpi-purple',
] as const;

export default function FaqSection() {
  const t = useTranslations('PricingPage');

  const faqItems: FAQItem[] = [
    {
      id: 'payment',
      question: t('faq.payment.q'),
      answer: t('faq.payment.a'),
    },
    {
      id: 'cancel',
      question: t('faq.cancel.q'),
      answer: t('faq.cancel.a'),
    },
    {
      id: 'storage',
      question: t('faq.storage.q'),
      answer: t('faq.storage.a'),
    },
    {
      id: 'upload',
      question: t('faq.upload.q'),
      answer: t('faq.upload.a'),
    },
  ];

  return (
    <section id="faqs" className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <HeaderSection
          title={t('faqTitle')}
          titleAs="h2"
          subtitleAs="p"
        />

        <div className="mx-auto max-w-4xl mt-6">
          <Accordion
            className="w-full space-y-2"
          >
            {faqItems.map((item, i) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-none"
              >
                <AccordionTrigger
                  className={cn(
                    'cursor-pointer rounded-xl px-4 py-3 text-base text-white hover:no-underline',
                    FAQ_ACCENT_CLASSES[i % FAQ_ACCENT_CLASSES.length]
                  )}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-muted-foreground">
                    {item.answer}
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
