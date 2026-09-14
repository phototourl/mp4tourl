'use client';

import { cn } from '@/lib/utils';
import type { AvatarProps } from '@radix-ui/react-avatar';
import { User2Icon } from 'lucide-react';

interface UserAvatarProps extends Omit<AvatarProps, 'children'> {
  name: string;
  image: string | null | undefined;
}

export function UserAvatar({
  name,
  image,
  className,
  ...props
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full bg-muted',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="sr-only">{name}</span>
        <User2Icon className="size-4" />
      </div>

      {image && (
        <img
          alt={name}
          title={name}
          src={image}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
          onLoad={(e) => {
            const fallback = e.currentTarget
              .previousElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.opacity = '0';
            }
          }}
          onError={(e) => {
            const fallback = e.currentTarget
              .previousElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.opacity = '1';
            }
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </div>
  );
}
