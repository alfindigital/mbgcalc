// @ts-nocheck
/**
 * OG image dinamis per-nominal (Supabase Edge Function, runtime Deno).
 *
 * STATUS: DITULIS, BELUM DI-DEPLOY (sesuai keputusan "client-only dulu").
 * Lihat README.md di folder ini untuk langkah deploy + cara menyambungkan ke
 * <meta property="og:image"> sehingga setiap tautan yang dibagikan menampilkan
 * preview gambar sesuai nominalnya.
 *
 * Endpoint contoh: /functions/v1/og-image?amount=271000000000000&compare=...
 */
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const DAILY_COST = Math.round(335_000_000_000_000 / 365); // sinkron dgn src/lib/mbg-constants.ts
const MS_PER_DAY = 86_400_000;
const COST_PER_PORSI = 10_000;

const UNITS = [
  { label: "Tahun", ms: MS_PER_DAY * 365 },
  { label: "Bulan", ms: MS_PER_DAY * 30 },
  { label: "Hari", ms: MS_PER_DAY },
  { label: "Jam", ms: 3_600_000 },
  { label: "Menit", ms: 60_000 },
  { label: "Detik", ms: 1_000 },
];

const idNum = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const fmtRupiah = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n));

function compact(num: number): string {
  if (!isFinite(num) || num <= 0) return "0";
  const tiers = [
    [1e15, "Kuadriliun"], [1e12, "T"], [1e9, "M"], [1e6, "Jt"], [1e3, "Rb"],
  ] as const;
  for (const [v, s] of tiers) {
    if (num >= v) {
      const val = num / v;
      const d = val >= 100 ? 0 : val >= 10 ? 1 : 2;
      return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: d }).format(val)} ${s}`;
    }
  }
  return fmtRupiah(num);
}

function primary(totalMs: number): { value: string; unit: string } {
  if (totalMs <= 0) return { value: "0", unit: "Detik" };
  for (const u of UNITS) {
    const val = totalMs / u.ms;
    if (val >= 1) return { value: val >= 100_000 ? compact(val) : idNum.format(val), unit: u.label };
  }
  const detik = totalMs / 1000;
  return { value: idNum.format(detik), unit: "Detik" };
}

export default function handler(req: Request) {
  const url = new URL(req.url);
  const amount = Math.max(0, parseInt(url.searchParams.get("amount") || "0", 10) || 0);
  const p = primary((amount / DAILY_COST) * MS_PER_DAY);
  const porsi = compact(amount / COST_PER_PORSI);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px", height: "630px", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "16px",
          background: "linear-gradient(180deg, #003366, #001a33)", color: "white",
          fontFamily: "sans-serif", padding: "60px",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2, opacity: 0.9 }}>KALKULATOR MBG</div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>Rp {fmtRupiah(amount)}</div>
        <div style={{ fontSize: 96, fontWeight: 800, color: "#FF9933" }}>{p.value} {p.unit}</div>
        <div style={{ fontSize: 28, opacity: 0.85 }}>operasional program MBG · ≈ {porsi} porsi makan gratis</div>
        <div style={{ fontSize: 20, opacity: 0.6, marginTop: 12 }}>mbgcal.lovable.app</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
