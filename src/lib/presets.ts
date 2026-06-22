/**
 * Preset skenario relatable — HANYA angka netral & bersumber resmi.
 *
 * ATURAN PENTING:
 * - Jangan masukkan tuduhan/angka kasus pidana yang belum berkekuatan hukum tetap
 *   (risiko pencemaran nama baik). Pakai angka publik resmi + sertakan sumber.
 * - Setiap entri WAJIB punya `source` yang bisa diverifikasi.
 *
 * Cara menambah: tinggal tambah objek baru ke array di bawah.
 */
export interface Preset {
  label: string;
  value: number;
  source: { label: string; url: string };
}

export const PRESETS: Preset[] = [
  {
    label: "Anggaran MBG 2026",
    value: 335_000_000_000_000,
    source: {
      label: "Kompas",
      url: "https://nasional.kompas.com/read/2026/01/19/20333411/anggaran-mbg-tahun-2026-meroket-jadi-rp-335-triliun",
    },
  },
  {
    label: "Anggaran MBG 2025",
    value: 71_000_000_000_000,
    source: {
      label: "APBN 2025",
      url: "https://www.detik.com/edu/detikpedia/d-8126284/resmi-mbg-dapat-rp-335-t-dari-apbn-2026-ambil-jatah-anggaran-pendidikan-rp-223-t",
    },
  },
  {
    label: "Realisasi MBG s.d. Mei 2026",
    value: 88_150_000_000_000,
    source: {
      label: "Kemenkeu",
      url: "https://www.rctiplus.com/news/detail/idxchannel/5399535/makan-bergizi-gratis--mbg--serap-apbn-rp88-15-triliun-hingga-mei-2026",
    },
  },
  {
    label: "1 dapur (SPPG) per bulan",
    value: 1_000_000_000,
    source: {
      label: "BGN",
      url: "https://kumparan.com/kumparanbisnis/bgn-anggaran-mbg-rp-335-t-tahun-ini-setiap-sppg-dapat-rp-1-m-per-bulan-26pPFljBaBm",
    },
  },
];
