import { websiteConfig } from './config/website';

/**
 * The routes for the application
 */
export enum Routes {
  Root = '/',

  // marketing pages
  FAQ = '/#faqs',
  Features = '/#features',
  Upload = '/#upload',
  HowToUse = '/#how-to-use',
  About = '/about',
  Contact = '/contact',
  CookiePolicy = '/cookie',
  PrivacyPolicy = '/privacy',
  TermsOfService = '/terms',

  // auth routes
  Login = '/auth/login',
  Register = '/auth/register',
  AuthError = '/auth/error',
  ForgotPassword = '/auth/forgot-password',
  ResetPassword = '/auth/reset-password',

  // dashboard routes
  Dashboard = '/dashboard',
  /** Protected: my uploaded videos (file-manager style) */
  Resources = '/resources',
  AdminUsers = '/admin/users',
  SettingsProfile = '/settings/profile',
  SettingsBilling = '/settings/billing',
  SettingsSecurity = '/settings/security',

  // payment processing
  Payment = '/payment',
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
  Routes.Resources,
  Routes.AdminUsers,
  Routes.SettingsProfile,
  Routes.SettingsBilling,
  Routes.SettingsSecurity,
  Routes.Payment,
];

/**
 * The default redirect path after logging in
 */
export const DEFAULT_LOGIN_REDIRECT =
  websiteConfig.routes.defaultLoginRedirect ?? Routes.Dashboard;
