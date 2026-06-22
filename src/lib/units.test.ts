import { describe, it, expect } from "vitest";
import {
  formatRupiah,
  formatNumber,
  formatCompact,
  parseRupiahInput,
  rupiahToMs,
  msToRupiah,
  rupiahToPorsi,
  getPrimaryResult,
  niceRound,
  sliderToRupiah,
  rupiahToSlider,
  SLIDER_MAX,
} from "./units";
import { MBG_DAILY_COST, MBG_ANNUAL_BUDGET } from "./mbg-constants";

describe("format", () => {
  it("formatRupiah memberi pemisah ribuan id-ID", () => {
    expect(formatRupiah(1_000_000)).toBe("1.000.000");
    expect(formatRupiah(0)).toBe("0");
    expect(formatRupiah(335_000_000_000_000)).toBe("335.000.000.000.000");
  });

  it("formatNumber memakai koma desimal", () => {
    expect(formatNumber(1.09, 2)).toBe("1,09");
    expect(formatNumber(1, 2)).toBe("1"); // trailing zero dibuang
  });

  it("formatCompact meringkas angka besar", () => {
    expect(formatCompact(1_250_000)).toBe("1,25 Jt");
    expect(formatCompact(1_000_000_000)).toBe("1 M");
    expect(formatCompact(335_000_000_000_000)).toBe("335 T");
    expect(formatCompact(0)).toBe("0");
  });

  it("parseRupiahInput membuang non-digit", () => {
    expect(parseRupiahInput("Rp 1.000.000")).toBe(1_000_000);
    expect(parseRupiahInput("abc")).toBe(0);
  });
});

describe("konversi inti", () => {
  it("biaya harian penuh = 1 Hari", () => {
    const r = getPrimaryResult(rupiahToMs(MBG_DAILY_COST));
    expect(r.unit).toBe("Hari");
    expect(r.value).toBe("1");
  });

  it("anggaran tahunan penuh = 1 Tahun", () => {
    const r = getPrimaryResult(rupiahToMs(MBG_ANNUAL_BUDGET));
    expect(r.unit).toBe("Tahun");
    expect(r.value).toBe("1");
  });

  it("msToRupiah membalik rupiahToMs", () => {
    expect(Math.round(msToRupiah(rupiahToMs(1_000_000)))).toBe(1_000_000);
  });

  it("memilih satuan natural (≥1), bukan notasi ilmiah", () => {
    expect(getPrimaryResult(rupiahToMs(1_000_000_000)).unit).toBe("Menit");
    expect(getPrimaryResult(rupiahToMs(100_000_000)).unit).toBe("Detik");
    // angka raksasa tetap dalam Tahun, tanpa "e+"
    const huge = getPrimaryResult(rupiahToMs(1_000_000_000_000_000_000));
    expect(huge.unit).toBe("Tahun");
    expect(huge.value).not.toContain("e");
  });

  it("nilai nol & negatif aman", () => {
    expect(getPrimaryResult(0)).toEqual({ value: "0", unit: "Detik" });
    expect(getPrimaryResult(-5)).toEqual({ value: "0", unit: "Detik" });
  });

  it("rupiahToPorsi: Rp 1 M = 100.000 porsi", () => {
    expect(rupiahToPorsi(1_000_000_000)).toBe(100_000);
    expect(formatCompact(rupiahToPorsi(1_000_000_000))).toBe("100 Rb");
  });
});

describe("slider", () => {
  it("bolak-balik posisi ↔ rupiah konsisten di ujung", () => {
    expect(sliderToRupiah(0)).toBe(0);
    expect(rupiahToSlider(0)).toBe(0);
    expect(rupiahToSlider(1_000_000_000_000)).toBeCloseTo(SLIDER_MAX, 5);
  });

  it("niceRound membulatkan ke 1/2/5 × 10^k", () => {
    expect(niceRound(1_348_962_883)).toBe(1_000_000_000);
    expect(niceRound(1_750_000_000)).toBe(2_000_000_000);
    expect(niceRound(600_000_000)).toBe(500_000_000);
    expect(niceRound(0)).toBe(0);
  });
});
