'use client';

// Module-level store (simple singleton pattern without external deps)
let currentLocaleValue: string = 'en';

export function getCurrentLocale(): string {
  return currentLocaleValue;
}

export function setCurrentLocale(locale: string): void {
  currentLocaleValue = locale;
}
