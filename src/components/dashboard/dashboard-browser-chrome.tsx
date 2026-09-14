'use client';

import { removeBrowserThemeColor } from '@/lib/app-ui-theme';
import { useLayoutEffect } from 'react';

/** 工作台路由：清掉 theme-color / 内联底色，状态栏用系统默认 */
export function DashboardBrowserChrome() {
  useLayoutEffect(() => {
    removeBrowserThemeColor();
    document.documentElement.style.backgroundColor = '';
    document.body.style.backgroundColor = '';
  }, []);

  return null;
}
