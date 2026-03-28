import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sun, Moon, X, Copy, Download, ChevronDown, ChevronUp } from "lucide-react";

// ─── Constants ───
const MBG_DAILY_COST = 1_200_000_000_000;
const MS_PER_DAY = 86_400_000;
const UNITS = [
  { key: "hari", label: "Hari", ms: MS_PER_DAY },
  { key: "jam", label: "Jam", ms: 3_600_000 },
  { key: "menit", label: "Menit", ms: 60_000 },
  { key: "detik", label: "Detik", ms: 1_000 },
  { key: "milidetik", label: "Milidetik", ms: 1 },
] as const;

const QUICK_AMOUNTS = [
  { label: "1 Juta", value: 1_000_000 },
  { label: "10 Juta", value: 10_000_000 },
  { label: "100 Juta", value: 100_000_000 },
];

// ─── Utility functions ───
function formatRupiah(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseRupiahInput(str: string): number {
  const digits = str.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function rupiahToMs(rupiah: number): number {
  return (rupiah / MBG_DAILY_COST) * MS_PER_DAY;
}

function msToRupiah(ms: number): number {
  return (ms / MS_PER_DAY) * MBG_DAILY_COST;
}

function formatSigDigits(n: number, sig = 7): string {
  if (n === 0) return "0";
  const s = parseFloat(n.toPrecision(sig));
  return formatRupiah(s);
}

function getPrimaryResult(totalMs: number): { value: string; unit: string } {
  for (const u of UNITS) {
    const val = totalMs / u.ms;
    if (val >= 0.01) {
      const days = totalMs / MS_PER_DAY;
      if (u.key === "hari" && days > 9999) {
        return { value: days.toExponential(2), unit: u.label };
      }
      const display = parseFloat(val.toFixed(2));
      return { value: formatRupiah(display), unit: u.label };
    }
  }
  return { value: "0", unit: "Milidetik" };
}

function getBreakdown(totalMs: number): { label: string; value: string }[] {
  return UNITS.map((u) => ({
    label: u.label,
    value: formatSigDigits(totalMs / u.ms),
  }));
}

// ─── Theme hook ───
function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("mbg-theme");
    if (stored) return stored === "dark";
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("mbg-theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

// ─── Debounce hook ───
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Result Card (memoized) ───
const ResultCard = React.memo(function ResultCard({
  rupiah,
  totalMs,
  inputFormatted,
}: {
  rupiah: number;
  totalMs: number;
  inputFormatted: string;
}) {
  const primary = getPrimaryResult(totalMs);
  const breakdown = getBreakdown(totalMs);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = `Rp ${inputFormatted} = ${primary.value} ${primary.unit} MBG`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [inputFormatted, primary]);

  if (rupiah <= 0) return null;

  return (
    <div className="relative rounded-xl border bg-card text-card-foreground shadow-sm p-5 animate-fade-in-up">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Salin hasil"
      >
        <Copy size={16} className="text-muted-foreground" />
      </button>

      {copied && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md shadow animate-slide-down">
          Tersalin!
        </div>
      )}

      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-result">{primary.value}</span>
        <span className="text-lg font-semibold text-result ml-1.5">{primary.unit} MBG</span>
      </div>

      <div className="border-t pt-3 space-y-1">
        {breakdown.map((b) => (
          <div key={b.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{b.label}</span>
            <span className="font-medium">{b.value}</span>
          </div>
        ))}
      </div>

      {rupiah > Number.MAX_SAFE_INTEGER && (
        <p className="text-xs text-destructive mt-3">⚠ Angka melebihi batas presisi JavaScript</p>
      )}
    </div>
  );
});

// ─── Main Page ───
export default function Index() {
  const [dark, toggleDark] = useTheme();
  const [rawInput, setRawInput] = useState("");
  const [activeQuick, setActiveQuick] = useState<number | null>(null);
  const [reverseOpen, setReverseOpen] = useState(true);
  const [reverseValue, setReverseValue] = useState("");
  const [reverseUnit, setReverseUnit] = useState("detik");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const rupiah = useMemo(() => parseRupiahInput(rawInput), [rawInput]);
  const debouncedRupiah = useDebounce(rupiah, 150);
  const totalMs = useMemo(() => rupiahToMs(debouncedRupiah), [debouncedRupiah]);
  const inputFormatted = useMemo(() => (rupiah > 0 ? formatRupiah(rupiah) : ""), [rupiah]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setActiveQuick(null);
    if (!digits) {
      setRawInput("");
      return;
    }
    setRawInput(formatRupiah(parseInt(digits, 10)));
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (digits) {
      setActiveQuick(null);
      setRawInput(formatRupiah(parseInt(digits, 10)));
    }
  }, []);

  const handleQuick = useCallback((val: number) => {
    setActiveQuick(val);
    setRawInput(formatRupiah(val));
  }, []);

  const handleClear = useCallback(() => {
    setRawInput("");
    setActiveQuick(null);
    inputRef.current?.focus();
  }, []);

  // Reverse calculation
  const reverseRupiah = useMemo(() => {
    const num = parseFloat(reverseValue);
    if (!num || num < 0) return 0;
    const unit = UNITS.find((u) => u.key === reverseUnit);
    if (!unit) return 0;
    return msToRupiah(num * unit.ms);
  }, [reverseValue, reverseUnit]);

  // Save as image
  const handleSaveImage = useCallback(async () => {
    if (!captureRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      captureRef.current.style.left = "0";
      captureRef.current.style.opacity = "1";
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        width: 1080,
        height: 1080,
        backgroundColor: null,
        useCORS: true,
      });
      captureRef.current.style.left = "-9999px";
      captureRef.current.style.opacity = "0";
      const link = document.createElement("a");
      link.download = `kalkulator-mbg-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const primary = useMemo(() => (debouncedRupiah > 0 ? getPrimaryResult(totalMs) : null), [debouncedRupiah, totalMs]);
  const breakdown = useMemo(() => (debouncedRupiah > 0 ? getBreakdown(totalMs) : []), [debouncedRupiah, totalMs]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <div className="w-full max-w-[420px] mx-auto px-4 py-6 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-primary">Kalkulator MBG</h1>
          <button
            onClick={toggleDark}
            className="p-2.5 rounded-xl hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Toggle tema"
          >
            {dark ? <Sun size={20} className="transition-transform duration-300 rotate-0 hover:rotate-90" /> : <Moon size={20} className="transition-transform duration-300 hover:-rotate-12" />}
          </button>
        </header>

        {/* Input */}
        <div className="mt-5">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-muted-foreground font-semibold text-lg select-none pointer-events-none">
              Rp
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={rawInput}
              onChange={handleInput}
              onPaste={handlePaste}
              placeholder="Ketik jumlah..."
              className="w-full h-14 pl-10 pr-10 rounded-xl border bg-card text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200 hover:shadow-md focus:shadow-lg focus:scale-[1.01]"
              style={{ fontSize: "18px" }}
            />
            {rawInput && (
              <button
                onClick={handleClear}
                className="absolute right-3 p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="Hapus"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Quick buttons */}
          <div className="flex gap-2 mt-3">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q.value}
                onClick={() => handleQuick(q.value)}
                className={`flex-1 h-11 rounded-lg text-sm font-semibold transition-all active:scale-[0.97] ${
                  activeQuick === q.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-primary text-primary hover:bg-primary/10"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {debouncedRupiah > 0 && (
          <div className="mt-5 space-y-3">
            <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} />

            <button
              onClick={handleSaveImage}
              disabled={saving}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <Download size={16} />
              {saving ? "Menyimpan..." : "Simpan Gambar"}
            </button>
          </div>
        )}

        {/* Reverse Mode */}
        <div className="mt-6 rounded-xl border bg-card p-4">
          <button
            onClick={() => setReverseOpen((o) => !o)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="font-semibold text-sm">Mode Terbalik</span>
            {reverseOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {reverseOpen && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={reverseValue}
                  onChange={(e) => setReverseValue(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="Jumlah"
                  className="flex-1 h-11 px-3 rounded-lg border bg-background text-base font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ fontSize: "16px" }}
                />
                <select
                  value={reverseUnit}
                  onChange={(e) => setReverseUnit(e.target.value)}
                  className="h-11 px-2 rounded-lg border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {UNITS.map((u) => (
                    <option key={u.key} value={u.key}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              {reverseRupiah > 0 && (
                <p className="text-lg font-bold text-result">
                  = Rp {formatRupiah(Math.round(reverseRupiah))}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground">made by M. Alfin</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Sumber data: Anggaran program MBG — Rp 71T/tahun ≈ Rp 1,2T/hari
          </p>
        </footer>
      </div>

      {/* Off-screen capture template */}
      <div
        ref={captureRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          opacity: 0,
          width: 1080,
          height: 1080,
          background: "linear-gradient(180deg, #003366, #001a33)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ color: "white", textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 2 }}>KALKULATOR MBG</div>
          <div style={{ fontSize: 20, opacity: 0.8, marginTop: 8 }}>Makan Bergizi Gratis</div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "48px 56px",
            width: "85%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: "#003366" }}>
            Rp {inputFormatted || "0"}
          </div>
          <div style={{ fontSize: 48, margin: "16px 0", color: "#888" }}>↓</div>
          {primary && (
            <div style={{ fontSize: 40, fontWeight: 800, color: "#FF6600" }}>
              {primary.value} {primary.unit} MBG
            </div>
          )}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              margin: "24px 0",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 18, color: "#374151" }}>
            {breakdown.map((b) => (
              <div key={b.label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{b.label}</span>
                <span style={{ fontWeight: 600 }}>{b.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: "white", textAlign: "center", marginTop: 36, fontSize: 14 }}>
          <div style={{ opacity: 0.9 }}>Proyeksi biaya harian program MBG: Rp 1,2 Triliun/hari</div>
          <div style={{ opacity: 0.6, marginTop: 4, fontSize: 12 }}>
            Sumber: BGN (Badan Gizi Nasional)
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 40,
            color: "white",
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          made by M. Alfin
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            color: "white",
            fontSize: 11,
            opacity: 0.3,
          }}
        >
          kalkulatormbg
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up { animation: fade-in-up 200ms ease-out; }
        .animate-slide-down { animation: slide-down 200ms ease-out; }
        .text-result { color: hsl(var(--result)); }
      `}</style>
    </div>
  );
}
