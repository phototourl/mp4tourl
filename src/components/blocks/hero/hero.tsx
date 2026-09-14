'use client';

import VideoUpload from '@/components/blocks/hero/video-upload';
import { TextEffect } from '@/components/tailark/motion/text-effect';
import { useTranslations } from 'next-intl';

/**
 * Landing hero aligned with VideoToURL-style flow:
 * headline → short pitch → upload dropzone.
 * https://www.videotourl.com/
 */
export default function HeroSection() {
  const t = useTranslations('HomePage.hero');

  return (
    <main id="hero" className="overflow-hidden">
      <section className="relative pt-16 pb-8">
        <div className="mx-auto max-w-4xl px-6 text-center">
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
            className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground"
          >
            {t('description')}
          </TextEffect>

          <p className="mt-4 text-sm text-muted-foreground">{t('tagline')}</p>

          <div id="upload" className="scroll-mt-24">
            <VideoUpload />
          </div>
        </div>
      </section>
    </main>
  );
}
