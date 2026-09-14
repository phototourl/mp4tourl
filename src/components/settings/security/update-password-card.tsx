'use client';

import { FormError } from '@/components/shared/form-error';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { settingsButtonPrimary } from '@/components/settings/settings-button-classes';
import { settingsCard } from '@/components/settings/settings-card-classes';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface UpdatePasswordCardProps {
  className?: string;
}

export function UpdatePasswordCard({ className }: UpdatePasswordCardProps) {
  const t = useTranslations('Dashboard.settings.security.updatePassword');
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | undefined>('');
  /** App Router 的 refresh；用 next/navigation 保证与 next-intl 解耦、类型稳定 */
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const formSchema = z.object({
    currentPassword: z.string().min(1, { message: t('currentRequired') }),
    newPassword: z.string().min(8, { message: t('newMinLength') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  const user = session?.user;
  if (!user) {
    return null;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await authClient.changePassword(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      },
      {
        onRequest: () => {
          setIsSaving(true);
          setError('');
        },
        onResponse: () => {
          setIsSaving(false);
        },
        onSuccess: () => {
          toast.success(t('success'));
          router.refresh();
          form.reset();
        },
        onError: (ctx) => {
          console.error('changePassword error:', ctx.error);
          setError(`${ctx.error.status}: ${ctx.error.message}`);
          toast.error(t('fail'));
        },
      },
    );
  };

  return (
    <Card
      className={cn(settingsCard, className)}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col"
        >
          <CardContent className="flex-1 space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('currentPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder={t('currentPassword')}
                        autoComplete="current-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showCurrentPassword
                            ? t('hidePassword')
                            : t('showPassword')}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('newPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder={t('newPassword')}
                        autoComplete="new-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full cursor-pointer px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showNewPassword
                            ? t('hidePassword')
                            : t('showPassword')}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormError message={error} />
          </CardContent>
          <CardFooter className="mt-6 flex items-center justify-between rounded-none bg-muted px-6 py-4">
            <p className="text-sm text-muted-foreground">{t('hint')}</p>
            <Button
              type="submit"
              disabled={isSaving}
              className={cn('cursor-pointer', settingsButtonPrimary)}
            >
              {isSaving ? t('saving') : t('save')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
