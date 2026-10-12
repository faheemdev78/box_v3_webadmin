// Preserve path segments and existing underscore routes while producing URL-safe slugs.
export function normalizePageSlug(value: unknown): string {
  const path = String(value ?? '').trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9/_-]+/g, '-')
    .split('/').map(segment => segment.replace(/-+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean).join('/');
  return path ? `/${path}` : (String(value ?? '').trim().match(/^\/+$/) ? '/' : '');
}
