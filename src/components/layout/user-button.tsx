'use client';

import { UserAvatar } from '@/components/layout/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAvatarLinks } from '@/config/avatar-config';
import { useLocaleRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type { User } from 'better-auth';
import { ChevronDown, LogOutIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface UserButtonProps {
  user: User;
}

/**
 * Desktop account control — editstamp style: avatar + name/email pill on the right.
 */
export function UserButton({ user }: UserButtonProps) {
  const t = useTranslations();
  const avatarLinks = useAvatarLinks();
  const localeRouter = useLocaleRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          localeRouter.replace('/');
        },
        onError: (error) => {
          console.error('sign out error:', error);
          toast.error(t('Common.logoutFailed'));
        },
      },
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger
        className={cn(
          'flex h-9 max-h-9 items-center gap-2 transition-all duration-200 ease-out',
          'outline-none focus-visible:outline-none focus-visible:ring-0',
          'rounded-full bg-muted/80 px-2.5 lg:px-3',
          'hover:bg-muted dark:bg-muted/60 dark:hover:bg-muted/80'
        )}
      >
        <UserAvatar
          name={user.name}
          image={user.image}
          className="size-7 shrink-0"
        />
        <div className="hidden lg:flex min-w-0 shrink-0 items-center gap-1.5">
          <div className="flex max-w-[10rem] flex-col justify-center gap-0 leading-none">
            <span className="w-full truncate text-left text-xs font-medium">
              {user.name}
            </span>
            <span className="w-full truncate text-left text-[10px] text-muted-foreground">
              {user.email}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out',
              open && 'rotate-180'
            )}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <div className="flex items-center justify-start gap-2 p-2">
          <UserAvatar
            name={user.name}
            image={user.image}
            className="size-8 shrink-0"
          />
          <div className="flex min-w-0 flex-1 flex-col space-y-0.5 leading-none">
            <p className="break-words font-medium">{user.name}</p>
            <p
              className="truncate text-sm text-muted-foreground"
              title={user.email ?? undefined}
            >
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />

        {avatarLinks.map((item) => (
          <DropdownMenuItem
            key={item.title}
            className="cursor-pointer"
            onClick={() => {
              if (item.href) {
                localeRouter.push(item.href);
              }
            }}
          >
            <div className="flex items-center space-x-2.5">
              {item.icon ? item.icon : null}
              <p className="text-sm">{item.title}</p>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={async (event) => {
            event.preventDefault();
            setOpen(false);
            handleSignOut();
          }}
        >
          <div className="flex items-center space-x-2.5">
            <LogOutIcon className="size-4" />
            <p className="text-sm">{t('Common.logout')}</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
