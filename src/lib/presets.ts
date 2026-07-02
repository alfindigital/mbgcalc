/**
 * Preset skenario relatable — HANYA angka netral & bersumber resmi.
 *
 * ATURAN PENTING:
 * - Jangan masukkan tuduhan/angka kasus pidana yang belum berkekuatan hukum tetap
 *   (risiko pencemaran nama baik). Pakai angka publik resmi + sertakan sumber.
 * - Setiap entri WAJIB punya `source` yang bisa diverifikasi.
 * - `trending: true` menandai preset yang lagi ramai dibahas — tampil dulu di UI.
 *
 * Cara menambah: tinggal tambah objek baru ke array di bawah.
 */
export interface Preset {
  label: string;
  short: string;         // label pendek untuk chip
  value: number;
  trending?: boolean;
  source: { label: string; url: string };
}

export const PRESETS: Preset[] = [
  {
    label: "Anggaran MBG 2026",
    short: "MBG 2026",
    value: 335_000_000_000_000,
    trending: true,
    source: {
      label: "Kompas",
      url: "https://nasional.kompas.com/read/2026/01/19/20333411/anggaran-mbg-tahun-2026-meroket-jadi-rp-335-triliun",
    },
  },
  {
    label: "Realisasi MBG s.d. Mei 2026",
    short: "Realisasi Mei '26",
    value: 88_150_000_000_000,
    trending: true,
    source: {
      label: "Kemenkeu",
      url: "https://www.rctiplus.com/news/detail/idxchannel/5399535/makan-bergizi-gratis--mbg--serap-apbn-rp88-15-triliun-hingga-mei-2026",
    },
  },
  {
    label: "Anggaran IKN 2026",
    short: "IKN 2026",
    value: 48_800_000_000_000,
    trending: true,
    source: {
      label: "Kemenkeu",
      url: "https://www.kemenkeu.go.id/",
    },
  },
  {
    label: "Anggaran MBG 2025",
    short: "MBG 2025",
    value: 71_000_000_000_000,
    source: {
      label: "APBN 2025",
      url: "https://www.detik.com/edu/detikpedia/d-8126284/resmi-mbg-dapat-rp-335-t-dari-apbn-2026-ambil-jatah-anggaran-pendidikan-rp-223-t",
    },
  },
  {
    label: "1 dapur SPPG per bulan",
    short: "1 SPPG/bln",
    value: 1_000_000_000,
    source: {
      label: "BGN",
      url: "https://kumparan.com/kumparanbisnis/bgn-anggaran-mbg-rp-335-t-tahun-ini-setiap-sppg-dapat-rp-1-m-per-bulan-26pPFljBaBm",
    },
  },
  {
    label: "Bansos PKH 2026",
    short: "PKH 2026",
    value: 28_700_000_000_000,
    source: {
      label: "Kemensos",
      url: "https://www.kemensos.go.id/",
    },
  },
];

/** Pasangan preset untuk mode Selisih (bandingkan). */
export interface PresetPair {
  label: string;
  a: { label: string; value: number };
  b: { label: string; value: number };
}

export const PRESET_PAIRS: PresetPair[] = [
  {
    label: "MBG 2025 vs 2026",
    a: { label: "MBG 2025", value: 71_000_000_000_000 },
    b: { label: "MBG 2026", value: 335_000_000_000_000 },
  },
  {
    label: "IKN vs MBG 2026",
    a: { label: "IKN 2026", value: 48_800_000_000_000 },
    b: { label: "MBG 2026", value: 335_000_000_000_000 },
  },
  {
    label: "PKH vs MBG 2026",
    a: { label: "PKH 2026", value: 28_700_000_000_000 },
    b: { label: "MBG 2026", value: 335_000_000_000_000 },
  },
];
