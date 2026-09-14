'use client';

interface ToolPageHeaderProps {
  toolName: string;
}

export function ToolPageHeader({ toolName }: ToolPageHeaderProps) {
  // Tool pages don't use dashboard header, they use SiteHeader
  // This component is kept for potential future use
  return null;
}
