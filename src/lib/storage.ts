/**
 * Akses localStorage yang aman.
 * Safari memblokir localStorage di iframe pihak ketiga, dan mode privat bisa
 * melempar error saat menulis. Semua akses dibungkus try/catch agar app
 * (termasuk halaman /embed) tidak pernah crash karena storage.
 */
export function getStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* abaikan: private mode / iframe pihak ketiga */
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* abaikan */
  }
}
