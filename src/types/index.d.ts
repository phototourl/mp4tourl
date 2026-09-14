import type { ReactNode } from 'react';

/**
 * menu item, used for navbar links, sidebar links, footer links
 */
export type MenuItem = {
  title: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  external?: boolean;
  authorizeOnly?: string[];
};

/**
 * nested menu item, used for navbar links, sidebar links, footer links
 */
export type NestedMenuItem = MenuItem & {
  items?: MenuItem[];
};
