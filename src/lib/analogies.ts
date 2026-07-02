/**
 * Analogi kontekstual untuk membantu otak menempelkan angka besar
 * ke referensi konkret. Dipilih agar SATU baris pendek, tanpa
 * klaim politik.
 *
 * Basis:
 * - 1 dapur (SPPG) ≈ Rp 1 M/bulan (BGN)
 * - MBG nasional ≈ Rp 917,8 M/hari (335 T ÷ 365)
 * - 1 porsi = Rp 10.000, target 82,9 juta penerima/hari
 */
export function getAnalogy(rupiah: number): string | null {
  if (rupiah < 10_000_000) return null;
  const tiers: { min: number; text: string }[] = [
    { min: 10_000_000, text: "≈ 1 kelas (30 anak) makan gratis 1 bulan" },
    { min: 100_000_000, text: "≈ 1 SD (300 anak) makan gratis 1 bulan" },
    { min: 1_000_000_000, text: "≈ 1 dapur SPPG beroperasi 1 bulan penuh" },
    { min: 10_000_000_000, text: "≈ 10 dapur SPPG (1 kecamatan) selama 1 bulan" },
    { min: 100_000_000_000, text: "≈ 100 dapur SPPG (1 kabupaten kecil) selama 1 bulan" },
    { min: 1_000_000_000_000, text: "≈ MBG seluruh Indonesia selama ~1 hari" },
    { min: 10_000_000_000_000, text: "≈ MBG seluruh Indonesia selama ~11 hari" },
    { min: 71_000_000_000_000, text: "≈ setara anggaran MBG tahun 2025 (Rp 71 T)" },
    { min: 100_000_000_000_000, text: "≈ MBG nasional selama ~4 bulan" },
    { min: 335_000_000_000_000, text: "≈ 1 tahun penuh MBG untuk 82,9 juta penerima" },
    { min: 670_000_000_000_000, text: "≈ 2 tahun penuh program MBG nasional" },
  ];
  let match: string | null = null;
  for (const t of tiers) if (rupiah >= t.min) match = t.text;
  return match;
}
