/**
 * Format a price for display
 * @param price Price amount in cents
 * @param currency Currency code
 * @param fractionDigits Optional fixed fraction digits (e.g. 2 → "$7.90")
 * @returns Formatted price string
 */
export function formatPrice(
  price: number,
  currency: string,
  fractionDigits?: number
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits ?? 0,
    ...(fractionDigits !== undefined
      ? { maximumFractionDigits: fractionDigits }
      : {}),
  });

  return formatter.format(price / 100);
}

/**
 * Format a date for display
 * @param date Date to format
 * @returns Formatted date string in the format "Month Day, Year"
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
