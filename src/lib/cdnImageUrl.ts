// New CDN records contain full URLs; older records contain relative paths.
export function cdnImageUrl(value?: string | null): string {
  if (!value) return '';
  if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
  return `${(process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '')}/${value}`;
}
