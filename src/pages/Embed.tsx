import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { rupiahToMs, getPrimaryResult, rupiahToPorsi, formatRupiah, formatCompact } from "@/lib/units";
import { SITE_URL } from "@/lib/site";

function ResultBlock({ amount }: { amount: number }) {
  const primary = useMemo(() => getPrimaryResult(rupiahToMs(amount)), [amount]);
  const porsi = useMemo(() => rupiahToPorsi(amount), [amount]);

  return (
    <div className="card-elevated rounded-2xl border-2 border-border p-4 result-glow">
      <div className="text-center">
        <div className="text-[11px] text-muted-foreground mb-1 font-medium">Rp {formatRupiah(amount)}</div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl sm:text-4xl font-extrabold text-result-glow tabular-nums">{primary.value}</span>
          <span className="text-sm sm:text-base font-bold text-result opacity-80">{primary.unit}</span>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground">operasional program MBG</span>
        <div className="mt-1.5">
          <span className="text-sm font-extrabold text-result">≈ {formatCompact(porsi)}</span>
          <span className="text-[10px] font-semibold text-muted-foreground"> porsi makan gratis</span>
        </div>
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

  const linkUrl = `${SITE_URL}/?amount=${amount}${compareMode ? `&compare=${amount2}` : ""}`;

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
              <div className="relative flex items-center w-full">
                <span className="absolute left-3 text-muted-foreground font-bold text-sm pointer-events-none">Rp</span>
                <input
                  type="text" inputMode="numeric" value={amount ? formatRupiah(amount) : ""}
                  onChange={(e) => setAmount(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
                  placeholder="Nominal A" aria-label="Nominal Rupiah"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border-2 border-border bg-card text-base font-bold focus:outline-none focus:border-accent"
                />
              </div>
              {compareMode && (
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3 text-muted-foreground font-bold text-sm pointer-events-none">Rp</span>
                  <input
                    type="text" inputMode="numeric" value={amount2 ? formatRupiah(amount2) : ""}
                    onChange={(e) => setAmount2(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
                    placeholder="Nominal B" aria-label="Nominal Rupiah kedua"
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
          <a href={linkUrl} target="_blank" rel="noopener noreferrer"
             className="text-[10px] text-muted-foreground hover:text-primary text-center mt-auto">
            kalkulator MBG · {new URL(SITE_URL).host}
          </a>
        </div>
      </div>
    </>
  );
}
