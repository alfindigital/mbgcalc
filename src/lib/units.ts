import { MBG_DAILY_COST, MBG_COST_PER_PORSI } from "./mbg-constants";

// ─── Waktu ───
export const MS_PER_DAY = 86_400_000;

/**
 * Satuan waktu, urut dari terbesar ke terkecil.
 * `tahun` & `bulan` ditambahkan agar angka raksasa (triliunan) tampil manusiawi
 * alih-alih "ribuan hari" atau notasi ilmiah.
 */
export const UNITS = [
  { key: "tahun", label: "Tahun", ms: MS_PER_DAY * 365 },
  { key: "bulan", label: "Bulan", ms: MS_PER_DAY * 30 },
  { key: "hari", label: "Hari", ms: MS_PER_DAY },
  { key: "jam", label: "Jam", ms: 3_600_000 },
  { key: "menit", label: "Menit", ms: 60_000 },
  { key: "detik", label: "Detik", ms: 1_000 },
  { key: "milidetik", label: "Milidetik", ms: 1 },
  { key: "mikrodetik", label: "Mikrodetik", ms: 0.001 },
  { key: "nanodetik", label: "Nanodetik", ms: 0.000_001 },
] as const;

export type UnitKey = (typeof UNITS)[number]["key"];

// ─── Slider logaritmik ───
export const SLIDER_MAX = 100;
const LOG_MAX = 12; // 10^12 = Rp 1 Triliun di ujung kanan

export function sliderToRupiah(pos: number): number {
  if (pos <= 0) return 0;
  return Math.round(Math.pow(10, (pos / SLIDER_MAX) * LOG_MAX));
}

export function rupiahToSlider(rupiah: number): number {
  if (rupiah <= 0) return 0;
  return Math.min((Math.log10(rupiah) / LOG_MAX) * SLIDER_MAX, SLIDER_MAX);
}

/** Bulatkan ke angka "cantik" (1/2/5 × 10^k) — dipakai saat slider dilepas. */
export function niceRound(n: number): number {
  if (n <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / mag; // 1..10
  const nice = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
  return nice * mag;
}

// ─── Format angka (locale id-ID) ───
const idInt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Rupiah bulat dengan pemisah ribuan: 1000000 → "1.000.000". */
export function formatRupiah(num: number): string {
  return idInt.format(Math.round(num));
}

/** Angka dengan desimal gaya Indonesia (koma): 1.09 → "1,09". */
export function formatNumber(num: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: maxFractionDigits }).format(num);
}

export function parseRupiahInput(str: string): number {
  const digits = str.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/** Ringkas angka besar: 1.250.000 → "1,25 Jt". */
export function formatCompact(num: number): string {
  if (!isFinite(num) || num <= 0) return "0";
  const tiers = [
    { v: 1e15, s: "Kuadriliun" },
    { v: 1e12, s: "T" },
    { v: 1e9, s: "M" },
    { v: 1e6, s: "Jt" },
    { v: 1e3, s: "Rb" },
  ];
  for (const t of tiers) {
    if (num >= t.v) {
      const val = num / t.v;
      const digits = val >= 100 ? 0 : val >= 10 ? 1 : 2;
      return `${formatNumber(val, digits)} ${t.s}`;
    }
  }
  return formatNumber(Math.round(num), 0);
}

// ─── Konversi inti ───
export function rupiahToMs(rupiah: number): number {
  return (rupiah / MBG_DAILY_COST) * MS_PER_DAY;
}

export function msToRupiah(ms: number): number {
  return (ms / MS_PER_DAY) * MBG_DAILY_COST;
}

/** Jumlah porsi makan gratis (≈ jatah 1 anak/hari) yang bisa dibiayai. */
export function rupiahToPorsi(rupiah: number): number {
  return rupiah / MBG_COST_PER_PORSI;
}

/**
 * Pilih satuan waktu paling natural untuk ditampilkan.
 * Aturan: satuan TERBESAR yang nilainya ≥ 1 (mis. 1,09 Hari, 3,6 Bulan, 1 Tahun).
 * Untuk nilai < 1 detik, tetap tampilkan dalam Detik (2 desimal) lalu Milidetik —
 * tidak pernah memakai notasi ilmiah.
 */
export function getPrimaryResult(totalMs: number): { value: string; unit: string } {
  if (!isFinite(totalMs) || totalMs <= 0) return { value: "0", unit: "Detik" };
  for (const u of UNITS) {
    const val = totalMs / u.ms;
    if (val >= 1) {
      if (val >= 100_000) return { value: formatCompact(val), unit: u.label };
      return { value: formatNumber(val, 2), unit: u.label };
    }
  }
  const detik = totalMs / 1000;
  if (detik >= 0.01) return { value: formatNumber(detik, 2), unit: "Detik" };
  if (totalMs >= 0.01) return { value: formatNumber(totalMs, 2), unit: "Milidetik" };
  return { value: "0", unit: "Detik" };
}
