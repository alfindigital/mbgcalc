import { useEffect, useRef, useState } from "react";
import { MBG_DAILY_COST } from "@/lib/mbg-constants";
import { formatRupiah } from "@/lib/units";

const PER_SEC = MBG_DAILY_COST / 86_400;

/**
 * Counter kecil: berapa Rp yang "sudah dibelanjakan" MBG sejak halaman dibuka.
 * Tick 1×/detik. Hormat prefers-reduced-motion → tetap tampil, tapi tidak tick.
 */
export function LiveMbgCounter() {
  const startRef = useRef(Date.now());
  const [spent, setSpent] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setSpent(((Date.now() - startRef.current) / 1000) * PER_SEC);
    }, 1000);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="card-elevated rounded-2xl border-2 border-border p-5 sm:p-6 text-center">
      <p className="text-xs font-semibold text-muted-foreground">
        MBG sudah menghabiskan sejak halaman dibuka
      </p>
      <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-result-glow tabular-nums tracking-tight" aria-live="off">
        Rp {formatRupiah(Math.round(spent))}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        ~Rp {formatRupiah(Math.round(PER_SEC))}/detik · basis Rp 917,8 M/hari
      </p>
    </div>
  );
}
