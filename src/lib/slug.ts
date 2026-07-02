/**
 * Parser slug pendek untuk deep-link.
 * "500m" → 500_000_000, "1t" → 1e12, "2.5jt" → 2_500_000, "10rb" → 10_000
 * Return null kalau tidak cocok.
 */
export function parseSlug(slug: string): number | null {
  if (!slug) return null;
  const m = slug.toLowerCase().replace(/-/g, "").match(/^(\d+(?:[.,]\d+)?)(k|rb|jt|juta|m|miliar|t|triliun)$/);
  if (!m) return null;
  const num = parseFloat(m[1].replace(",", "."));
  if (!isFinite(num) || num <= 0) return null;
  const mult: Record<string, number> = {
    k: 1e3, rb: 1e3,
    jt: 1e6, juta: 1e6,
    m: 1e9, miliar: 1e9,
    t: 1e12, triliun: 1e12,
  };
  const factor = mult[m[2]];
  return factor ? Math.round(num * factor) : null;
}
