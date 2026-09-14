'use client';

import { useEffect } from 'react';
import { clearDashboardChrome } from '@/lib/app-ui-theme';

/**
 * Guardrail: ensure dashboard "technology theme" never leaks
 * into public/auth pages (it is toggled via <html> class).
 */
export function ResetTechnologyTheme() {
  useEffect(() => {
    clearDashboardChrome();
  }, []);

  return null;
}

