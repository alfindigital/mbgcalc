/**
 * Konfigurasi situs terpusat.
 *
 * Ganti SITE_URL saat deploy ke domain kustom.
 * Bisa di-override via env: VITE_SITE_URL (opsional).
 *
 * Contoh (.env.local):
 *   VITE_SITE_URL=https://kalkulatormbg.id
 */
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://YOUR_DOMAIN";
