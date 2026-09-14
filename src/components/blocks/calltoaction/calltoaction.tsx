'use client';

import {
  AmbientBlobs,
  ScrollReveal,
} from '@/components/motion/scroll-reveal';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

export default function CallToActionSection() {
  const t = useTranslations('HomePage.calltoaction');
  const reduce = useReducedMotion();

  return (
    <section
      id="call-to-action"
      className="relative overflow-hidden bg-muted/50 px-4 py-20 md:py-28"
    >
      <AmbientBlobs />
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground md:text-lg">
            {t('description')}
          </p>

          <motion.div
            className="mt-12 flex flex-wrap justify-center gap-4"
            whileHover={reduce ? undefined : { scale: 1.02 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
          >
            <Button asChild size="lg">
              <LocaleLink href="/#upload">
                <span>{t('primaryButton')}</span>
              </LocaleLink>
            </Button>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
