/**
 * Wrapper analytics GA4 yang aman (no-op bila gtag belum dipasang / diblokir).
 * gtag di-load oleh script di index.html. Kalau Measurement ID masih placeholder,
 * script tidak menginisialisasi gtag sehingga track() menjadi no-op — aman.
 */
type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
  } catch {
    /* analytics tidak boleh pernah mengganggu UX */
  }
}
