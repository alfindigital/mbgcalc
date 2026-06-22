/**
 * Konstanta program MBG (Makan Bergizi Gratis).
 * Update terakhir: Juni 2026.
 *
 * METODOLOGI (transparan & konsisten):
 * - Anggaran MBG 2026 = Rp 335 triliun (pagu Rp 268 T + dana standby Rp 67 T),
 *   naik ~5x dari Rp 71 T (2025). Sumber: UU APBN 2026 / pemberitaan resmi.
 * - Biaya harian = anggaran tahunan ÷ 365 hari = Rp 335 T ÷ 365 ≈ Rp 917,8 miliar/hari.
 *   (Basis dipilih agar SATU sumber konsisten & mudah diverifikasi. Rp 335 T = tepat 1 tahun.)
 * - Biaya per porsi = Rp 10.000 (standar BGN — Badan Gizi Nasional).
 * - Target penerima manfaat 2026 = 82,9 juta orang (siswa, ibu hamil, balita).
 *
 * Catatan: kalau ingin memakai pagu Rp 268 T (bukan total 335 T), cukup ubah
 * MBG_ANNUAL_BUDGET di bawah — semua turunan ikut menyesuaikan otomatis.
 */
export const MBG_BUDGET_YEAR = 2026;

/** Anggaran tahunan (Rp). Ganti angka ini saja untuk re-kalibrasi seluruh app. */
export const MBG_ANNUAL_BUDGET = 335_000_000_000_000;

/** Biaya harian = anggaran tahunan ÷ 365. Diturunkan otomatis, jangan di-hardcode. */
export const MBG_DAILY_COST = Math.round(MBG_ANNUAL_BUDGET / 365);

/** Biaya per porsi makan (standar BGN). */
export const MBG_COST_PER_PORSI = 10_000;

/** Target penerima manfaat (orang). */
export const MBG_RECIPIENTS = 82_900_000;

export const MBG_DATA_UPDATED = "Juni 2026";

/** Label siap-pakai untuk UI (agar tidak ada angka ter-hardcode di banyak tempat). */
export const MBG_ANNUAL_LABEL = "Rp 335 triliun";
export const MBG_DAILY_LABEL = "Rp 917,8 miliar";

export const MBG_SOURCES = [
  {
    label: "APBN 2026 — anggaran MBG Rp 335 T (Kompas)",
    url: "https://nasional.kompas.com/read/2026/01/19/20333411/anggaran-mbg-tahun-2026-meroket-jadi-rp-335-triliun",
  },
  {
    label: "Rincian pagu Rp 268 T + standby Rp 67 T (Bloomberg Technoz)",
    url: "https://www.bloombergtechnoz.com/detail-news/96576/anggaran-mbg-2026-tembus-rp335-t-alokasi-beli-makanan-cuma-76",
  },
  {
    label: "Badan Gizi Nasional (BGN)",
    url: "https://bgn.go.id/",
  },
];
