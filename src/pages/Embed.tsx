import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { MBG_DAILY_COST, MBG_COST_PER_PORSI, MBG_ANNUAL_BUDGET } from "@/lib/mbg-constants";

const MS_PER_DAY = 86_400_000;
const UNITS = [
  { key: "hari", label: "Hari", ms: MS_PER_DAY },
  { key: "jam", label: "Jam", ms: 3_600_000 },
  { key: "menit", label: "Menit", ms: 60_000 },
  { key: "detik", label: "Detik", ms: 1_000 },
  { key: "milidetik", label: "Milidetik", ms: 1 },
] as const;

function formatRupiah(n: number) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function formatCompact(num: number): string {
  if (!isFinite(num) || num <= 0) return "0";
  const tiers = [{ v: 1e12, s: "T" }, { v: 1e9, s: "M" }, { v: 1e6, s: "Jt" }, { v: 1e3, s: "Rb" }];
  for (const t of tiers) {
    if (num >= t.v) {
      const val = num / t.v;
      const fixed = val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2);
      return `${fixed.replace(".", ",").replace(/,?0+$/, "")} ${t.s}`;
    }
  }
  return formatRupiah(Math.round(num));
}
function getPrimary(totalMs: number) {
  for (const u of UNITS) {
    const v = totalMs / u.ms;
    if (v >= 0.01) return { value: formatRupiah(parseFloat(v.toFixed(2))), unit: u.label };
  }
  return { value: "0", unit: "Milidetik" };
}

function ResultBlock({ amount }: { amount: number }) {
  const totalMs = (amount / MBG_DAILY_COST) * MS_PER_DAY;
  const primary = useMemo(() => getPrimary(totalMs), [totalMs]);

  return (
    <div className="card-elevated rounded-2xl border-2 border-border p-4 result-glow">
      <div className="text-center">
        <div className="text-[11px] text-muted-foreground mb-1 font-medium">Rp {formatRupiah(amount)}</div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl sm:text-4xl font-extrabold text-result-glow tabular-nums">{primary.value}</span>
          <span className="text-sm sm:text-base font-bold text-result opacity-80">{primary.unit}</span>
        </div>
        <span className="text-[11px] font-semibold text-result/80">operasional MBG</span>
      </div>
    </div>
  );
}

export default function Embed() {
  const [sp] = useSearchParams();
  const minimal = sp.get("minimal") === "1";
  const theme = sp.get("theme");
  const initialAmount = Math.max(0, parseInt(sp.get("amount") || "0", 10) || 0);
  const compareParam = sp.get("compare");
  const initialCompare = compareParam !== null ? Math.max(0, parseInt(compareParam, 10) || 0) : null;
  const [amount, setAmount] = useState(initialAmount);
  const [amount2, setAmount2] = useState<number | null>(initialCompare);
  const compareMode = amount2 !== null;

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else if (theme === "light") document.documentElement.classList.remove("dark");
  }, [theme]);

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Kalkulator MBG — Embed</title>
      </Helmet>
      <div className="min-h-screen min-h-[100dvh] bg-background text-foreground p-3 sm:p-4 flex flex-col">
        <div className="max-w-[560px] w-full mx-auto flex-1 flex flex-col gap-3">
          {!minimal && (
            <div className={compareMode ? "grid grid-cols-2 gap-2" : "flex"}>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground font-bold text-sm pointer-events-none">Rp</span>
                <input
                  type="text" inputMode="numeric" value={amount ? formatRupiah(amount) : ""}
                  onChange={(e) => setAmount(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
                  placeholder="Nominal A"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border-2 border-border bg-card text-base font-bold focus:outline-none focus:border-accent"
                />
              </div>
              {compareMode && (
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground font-bold text-sm pointer-events-none">Rp</span>
                  <input
                    type="text" inputMode="numeric" value={amount2 ? formatRupiah(amount2) : ""}
                    onChange={(e) => setAmount2(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
                    placeholder="Nominal B"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border-2 border-border bg-card text-base font-bold focus:outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>
          )}
          {compareMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amount > 0 && <ResultBlock amount={amount} />}
              {amount2! > 0 && <ResultBlock amount={amount2!} />}
            </div>
          ) : (
            amount > 0 && <ResultBlock amount={amount} />
          )}
          <a href={`https://mbgcal.lovable.app/?amount=${amount}${compareMode ? `&compare=${amount2}` : ""}`} target="_blank" rel="noopener noreferrer"
             className="text-[10px] text-muted-foreground hover:text-primary text-center mt-auto">
            kalkulator MBG · mbgcal.lovable.app
          </a>
        </div>
      </div>
    </>
  );
}
