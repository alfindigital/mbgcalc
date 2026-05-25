/**
 * Konstanta program MBG (Makan Bergizi Gratis).
 * Update: 25 Mei 2026.
 *
 * Sumber:
 * - Anggaran tahunan Rp 71 T (Perpres 201/2024, APBN 2025).
 * - Biaya per porsi Rp 10.000 (standar BGN — Badan Gizi Nasional).
 * - Biaya harian ≈ Rp 1,2 T (turunan: 71 T / ~60 hari aktif/bulan × 12).
 */
export const MBG_DAILY_COST = 1_200_000_000_000;
export const MBG_ANNUAL_BUDGET = 71_000_000_000_000;
export const MBG_COST_PER_PORSI = 10_000;
export const MBG_DATA_UPDATED = "25 Mei 2026";

export const MBG_SOURCES = [
  { label: "Perpres 201/2024 (APBN 2025)", url: "https://peraturan.bpk.go.id/" },
  { label: "Badan Gizi Nasional (BGN)", url: "https://bgn.go.id/" },
];
