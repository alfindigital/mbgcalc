import { formatCompact } from "@/lib/units";

/**
 * Bar chart horizontal sederhana — perbandingan MBG vs pos APBN lain.
 * Pakai div biasa (tanpa lib chart) agar bundle tetap ringan.
 */
const ITEMS = [
  { label: "Pendidikan", value: 724_000_000_000_000, color: "bg-blue-500" },
  { label: "Subsidi & Kompensasi Energi", value: 394_300_000_000_000, color: "bg-amber-500" },
  { label: "MBG 2026", value: 335_000_000_000_000, color: "bg-primary", highlight: true },
  { label: "Kesehatan", value: 218_400_000_000_000, color: "bg-emerald-500" },
  { label: "Infrastruktur", value: 200_800_000_000_000, color: "bg-purple-500" },
  { label: "IKN 2026", value: 48_800_000_000_000, color: "bg-rose-500" },
];

export function BudgetChart() {
  const max = Math.max(...ITEMS.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {ITEMS.map((it) => {
        const pct = (it.value / max) * 100;
        return (
          <div key={it.label} className={`${it.highlight ? "font-bold" : "font-medium"}`}>
            <div className="flex items-baseline justify-between text-xs sm:text-sm mb-1">
              <span className={it.highlight ? "text-primary" : "text-foreground"}>{it.label}</span>
              <span className="tabular-nums text-muted-foreground">Rp {formatCompact(it.value)}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${it.color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-muted-foreground pt-2 leading-relaxed">
        Sumber: APBN 2026 (Kemenkeu). Angka dibulatkan untuk visualisasi.
      </p>
    </div>
  );
}
