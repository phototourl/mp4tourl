'use client';

import { sendMessageAction } from '@/actions/send-message';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

const inputClassName =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

type ContactFormErrorKey =
  | 'minLength'
  | 'maxLengthName'
  | 'invalidEmail'
  | 'minLengthMessage'
  | 'maxLengthMessage'
  | 'invalid';

function asContactFormErrorKey(key: string): ContactFormErrorKey {
  const known: ContactFormErrorKey[] = [
    'minLength',
    'maxLengthName',
    'invalidEmail',
    'minLengthMessage',
    'maxLengthMessage',
    'invalid',
  ];
  return known.includes(key as ContactFormErrorKey)
    ? (key as ContactFormErrorKey)
    : 'invalid';
}

export function ContactFormCard() {
  const t = useTranslations('ContactPage.form');
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('idle');
    setErrorKey(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await sendMessageAction(formData);
      if (result.success) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
        setErrorKey(result.error);
      }
    });
  }

  return (
    <Card className="mx-auto max-w-lg overflow-hidden border-border pt-6 pb-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="contact-name"
              className="mb-1 block text-sm font-medium"
            >
              {t('name')}
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={100}
              disabled={isPending}
              className={inputClassName}
              placeholder={t('namePlaceholder')}
            />
          </div>
          <div>
            <label
              htmlFor="contact-email"
              className="mb-1 block text-sm font-medium"
            >
              {t('email')}
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              disabled={isPending}
              className={inputClassName}
              placeholder={t('emailPlaceholder')}
            />
          </div>
          <div>
            <label
              htmlFor="contact-message"
              className="mb-1 block text-sm font-medium"
            >
              {t('message')}
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              disabled={isPending}
              className={cn(inputClassName, 'resize-y')}
              placeholder={t('messagePlaceholder')}
            />
          </div>
          {status === 'success' && (
            <p className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-200">
              {t('success')}
            </p>
          )}
          {status === 'error' && errorKey && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {t(asContactFormErrorKey(errorKey))}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex items-center border-t border-border bg-muted/50 px-6 py-4">
          <Button type="submit" disabled={isPending} variant="default">
            {isPending ? t('submitting') : t('submit')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
