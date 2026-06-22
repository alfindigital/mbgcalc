import { describe, it, expect } from "vitest";
import { terbilang } from "./terbilang";

describe("terbilang", () => {
  it("angka dasar", () => {
    expect(terbilang(0)).toBe("nol");
    expect(terbilang(5)).toBe("lima");
    expect(terbilang(11)).toBe("sebelas");
    expect(terbilang(15)).toBe("lima belas");
    expect(terbilang(21)).toBe("dua puluh satu");
    expect(terbilang(100)).toBe("seratus");
    expect(terbilang(335)).toBe("tiga ratus tiga puluh lima");
  });

  it("ribuan: 'seribu' khusus", () => {
    expect(terbilang(1_000)).toBe("seribu");
    expect(terbilang(1_100)).toBe("seribu seratus");
    expect(terbilang(2_000)).toBe("dua ribu");
  });

  it("skala besar", () => {
    expect(terbilang(71_000_000_000_000)).toBe("tujuh puluh satu triliun");
    expect(terbilang(335_000_000_000_000)).toBe("tiga ratus tiga puluh lima triliun");
  });

  it("input non-finite aman", () => {
    expect(terbilang(Infinity)).toBe("");
    expect(terbilang(NaN)).toBe("");
  });
});
