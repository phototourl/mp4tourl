'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonSmallProps {
	className?: string;
	href?: string;
}

export default function BackButtonSmall({ className, href }: BackButtonSmallProps) {
	const router = useRouter();

	const handleClick = () => {
		if (href) {
			router.push(href);
		} else {
			router.back();
		}
	};

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleClick}
			className={cn('gap-2 text-muted-foreground hover:text-foreground', className)}
		>
			<ArrowLeft className="size-4" />
		</Button>
	);
}
