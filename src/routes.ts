/**
 * The routes for the application
 */
export enum Routes {
  Root = '/',

  // Dashboard (workbench shell)
  Dashboard = '/dashboard',

  // Settings (workbench shell)
  SettingsProfile = '/settings/profile',
  SettingsBilling = '/settings/billing',
  SettingsSecurity = '/settings/security',
  SettingsNotifications = '/settings/notifications',

  // Paywall
  Paywall = '/paywall',
  Pricing = '/pricing',

  // tool routes (standalone, no workbench)
  CircleCrop = '/circle-crop',
  RoundedCorners = '/rounded-corners',
  RemoveBackground = '/remove-background',
  PdfToUrl = '/pdf-to-url',
  FileToUrl = '/file-to-url',
  ArtFightImageHosting = '/art-fight-image-hosting',

  // auth routes
  Login = '/auth/login',
  Register = '/auth/register',
  ForgotPassword = '/auth/forgot-password',
  ResetPassword = '/auth/reset-password',

  // public pages
  Blog = '/blog',
  About = '/about',
  Contact = '/contact',
  FAQ = '/faq',
  Bookmarklet = '/bookmarklet',
  Status = '/status',

  // legal
  Privacy = '/privacy',
  Terms = '/terms',
  Cookie = '/cookie',
  Impressum = '/impressum',
}

/**
 * The routes that can not be accessed by logged in users
 */
export const routesNotAllowedByLoggedInUsers = [Routes.Login, Routes.Register];

/**
 * The routes that are protected and require authentication
 */
export const protectedRoutes = [
  Routes.Dashboard,
  Routes.SettingsProfile,
  Routes.SettingsBilling,
  Routes.SettingsSecurity,
  Routes.SettingsNotifications,
];

/**
 * The default redirect path after logging in
 */
export const DEFAULT_LOGIN_REDIRECT = Routes.Root;
