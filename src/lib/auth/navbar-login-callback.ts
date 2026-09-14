/**
 * 导航栏登录成功后的跳转：
 * - 定价页：留在当前页
 * - 其它页：进工作台
 */
export function getNavbarLoginCallbackUrl(localePathname: string): string {
  if (
    localePathname === '/pricing' ||
    localePathname.startsWith('/pricing/')
  ) {
    return localePathname;
  }
  return '/dashboard';
}
