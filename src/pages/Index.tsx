import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sun, Moon, X, Copy, Download, ChevronDown, ChevronUp, Trash2, ArrowLeftRight, Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useHistory } from "@/hooks/useHistory";

// ─── Constants ───
const MBG_DAILY_COST = 1_200_000_000_000;
const MS_PER_DAY = 86_400_000;
const UNITS = [
  { key: "hari", label: "Hari", ms: MS_PER_DAY },
  { key: "jam", label: "Jam", ms: 3_600_000 },
  { key: "menit", label: "Menit", ms: 60_000 },
  { key: "detik", label: "Detik", ms: 1_000 },
  { key: "milidetik", label: "Milidetik", ms: 1 },
  { key: "mikrodetik", label: "Mikrodetik", ms: 0.001 },
  { key: "nanodetik", label: "Nanodetik", ms: 0.000_001 },
] as const;

const QUICK_AMOUNTS = [
  { label: "1 Juta", value: 1_000_000 },
  { label: "10 Juta", value: 10_000_000 },
  { label: "100 Juta", value: 100_000_000 },
];

// ─── Slider log scale helpers ───
const SLIDER_MAX = 100;
const LOG_MAX = 12;

function sliderToRupiah(pos: number): number {
  if (pos <= 0) return 0;
  return Math.round(Math.pow(10, (pos / SLIDER_MAX) * LOG_MAX));
}

function rupiahToSlider(rupiah: number): number {
  if (rupiah <= 0) return 0;
  const pos = (Math.log10(rupiah) / LOG_MAX) * SLIDER_MAX;
  return Math.min(Math.max(pos, 0), SLIDER_MAX);
}

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
  if (Number.isInteger(s) && s >= 1) return formatRupiah(s);
  return s.toLocaleString("id-ID", { maximumSignificantDigits: sig });
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
  compact,
}: {
  rupiah: number;
  totalMs: number;
  inputFormatted: string;
  compact?: boolean;
}) {
  const animatedMs = useAnimatedNumber(totalMs, 400);
  const primary = getPrimaryResult(animatedMs);
  const [copied, setCopied] = useState(false);
  const actualPrimary = getPrimaryResult(totalMs);

  const handleCopy = useCallback(() => {
    const text = `Rp ${inputFormatted} = ${actualPrimary.value} ${actualPrimary.unit} MBG`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [inputFormatted, actualPrimary]);

  if (rupiah <= 0) return null;

  return (
    <div className={`relative card-elevated rounded-2xl border ${compact ? "p-4" : "p-6"} animate-fade-in-up ${!compact ? "result-glow" : ""}`}>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-xl hover:bg-muted/80 transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Salin hasil"
      >
        <Copy size={compact ? 14 : 16} className="text-muted-foreground" />
      </button>

      {copied && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-lg shadow-lg animate-slide-down font-medium">
          Tersalin!
        </div>
      )}

      <div className="text-center">
        {compact && (
          <div className="text-xs text-muted-foreground mb-2 font-medium">Rp {inputFormatted}</div>
        )}
        <div className="flex items-baseline justify-center gap-1.5">
          <span className={`${compact ? "text-2xl" : "text-4xl"} font-extrabold text-result-glow tabular-nums tracking-tight`}>
            {primary.value}
          </span>
          <span className={`${compact ? "text-sm" : "text-lg"} font-bold text-result opacity-80`}>
            {primary.unit} MBG
          </span>
        </div>
      </div>

      {rupiah > Number.MAX_SAFE_INTEGER && (
        <p className="text-xs text-destructive mt-3 text-center">⚠ Angka melebihi batas presisi JavaScript</p>
      )}
    </div>
  );
});

// ─── History List (lazy load) ───
const HistoryList = React.memo(function HistoryList({
  history,
  onTap,
}: {
  history: { rupiah: number; timestamp: number }[];
  onTap: (val: number) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? history : history.slice(0, 5);

  return (
    <div className="mt-3 space-y-1 animate-fade-in-up">
      {visible.map((entry) => {
        const ms = rupiahToMs(entry.rupiah);
        const res = getPrimaryResult(ms);
        return (
          <button
            key={entry.timestamp}
            onClick={() => onTap(entry.rupiah)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all duration-200 text-sm group"
          >
            <span className="font-semibold group-hover:text-primary transition-colors">Rp {formatRupiah(entry.rupiah)}</span>
            <span className="text-result font-bold text-xs">
              {res.value} {res.unit}
            </span>
          </button>
        );
      })}
      {!showAll && history.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-xs text-accent font-semibold py-2.5 hover:bg-muted/60 rounded-xl transition-all duration-200"
        >
          Selengkapnya ({history.length - 5} lagi)
        </button>
      )}
    </div>
  );
});

// ─── Section wrapper ───
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-elevated rounded-2xl border p-5 ${className}`}>
      {children}
    </div>
  );
}

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

  const [compareMode, setCompareMode] = useState(false);
  const [rawInput2, setRawInput2] = useState("");
  const [activeQuick2, setActiveQuick2] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { history, addToHistory, clearHistory } = useHistory();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const rupiah = useMemo(() => parseRupiahInput(rawInput), [rawInput]);
  const debouncedRupiah = useDebounce(rupiah, 150);
  const totalMs = useMemo(() => rupiahToMs(debouncedRupiah), [debouncedRupiah]);
  const inputFormatted = useMemo(() => (rupiah > 0 ? formatRupiah(rupiah) : ""), [rupiah]);

  const rupiah2 = useMemo(() => parseRupiahInput(rawInput2), [rawInput2]);
  const debouncedRupiah2 = useDebounce(rupiah2, 150);
  const totalMs2 = useMemo(() => rupiahToMs(debouncedRupiah2), [debouncedRupiah2]);
  const inputFormatted2 = useMemo(() => (rupiah2 > 0 ? formatRupiah(rupiah2) : ""), [rupiah2]);

  const prevDebouncedRef = useRef(0);
  useEffect(() => {
    if (debouncedRupiah > 0 && debouncedRupiah !== prevDebouncedRef.current) {
      prevDebouncedRef.current = debouncedRupiah;
      addToHistory(debouncedRupiah);
    }
  }, [debouncedRupiah, addToHistory]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setActiveQuick(null);
    if (!digits) { setRawInput(""); return; }
    setRawInput(formatRupiah(parseInt(digits, 10)));
  }, []);

  const handleInput2 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setActiveQuick2(null);
    if (!digits) { setRawInput2(""); return; }
    setRawInput2(formatRupiah(parseInt(digits, 10)));
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (digits) { setActiveQuick(null); setRawInput(formatRupiah(parseInt(digits, 10))); }
  }, []);

  const handleQuick = useCallback((val: number) => { setActiveQuick(val); setRawInput(formatRupiah(val)); }, []);
  const handleQuick2 = useCallback((val: number) => { setActiveQuick2(val); setRawInput2(formatRupiah(val)); }, []);
  const handleClear = useCallback(() => { setRawInput(""); setActiveQuick(null); inputRef.current?.focus(); }, []);
  const handleClear2 = useCallback(() => { setRawInput2(""); setActiveQuick2(null); }, []);
  const handleHistoryTap = useCallback((val: number) => { setRawInput(formatRupiah(val)); setActiveQuick(null); inputRef.current?.focus(); }, []);

  const reverseRupiah = useMemo(() => {
    const num = parseFloat(reverseValue);
    if (!num || num < 0) return 0;
    const unit = UNITS.find((u) => u.key === reverseUnit);
    if (!unit) return 0;
    return msToRupiah(num * unit.ms);
  }, [reverseValue, reverseUnit]);

  const diffMs = useMemo(() => Math.abs(totalMs - totalMs2), [totalMs, totalMs2]);
  const diffRupiah = useMemo(() => Math.abs(debouncedRupiah - debouncedRupiah2), [debouncedRupiah, debouncedRupiah2]);

  const handleSaveImage = useCallback(async () => {
    if (!captureRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      captureRef.current.style.left = "0";
      captureRef.current.style.opacity = "1";
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, width: 1080, height: 1080, backgroundColor: null, useCORS: true,
      });
      captureRef.current.style.left = "-9999px";
      captureRef.current.style.opacity = "0";
      const link = document.createElement("a");
      link.download = `kalkulator-mbg-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { /* silently fail */ } finally { setSaving(false); }
  }, [saving]);

  const primary = useMemo(() => (debouncedRupiah > 0 ? getPrimaryResult(totalMs) : null), [debouncedRupiah, totalMs]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-[440px] mx-auto px-5 py-8 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Calculator size={18} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">Kalkulator MBG</h1>
          </div>
          <button
            onClick={toggleDark}
            className="p-2.5 rounded-xl border bg-card hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            aria-label="Toggle tema"
          >
            {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-muted-foreground" />}
          </button>
        </header>

        {/* Mode Toggle */}
        <div className="flex items-center justify-center mb-5">
          <div className="inline-flex rounded-xl border bg-muted/50 p-1 text-sm backdrop-blur-sm">
            <button
              onClick={() => setCompareMode(false)}
              className={`px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${
                !compareMode
                  ? "bg-card text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setCompareMode(true)}
              className={`px-5 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                compareMode
                  ? "bg-card text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowLeftRight size={14} />
              Bandingkan
            </button>
          </div>
        </div>

        {/* Input Area — both always rendered, animated transitions */}
        <div className="relative">
          <div
            className={`transition-all duration-300 ease-out ${
              !compareMode
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-2 scale-[0.97] pointer-events-none absolute inset-0"
            }`}
          >
            <div className="space-y-4">
              <div className="relative flex items-center group">
                <span className="absolute left-4 text-muted-foreground font-bold text-base select-none pointer-events-none transition-colors group-focus-within:text-primary">
                  Rp
                </span>
                <input
                  ref={!compareMode ? inputRef : undefined}
                  type="text"
                  inputMode="numeric"
                  value={rawInput}
                  onChange={handleInput}
                  onPaste={handlePaste}
                  placeholder="Ketik jumlah..."
                  className="w-full h-14 pl-11 pr-11 rounded-2xl border-2 border-border bg-card text-lg font-bold focus:outline-none focus:border-accent input-glow transition-all duration-200 hover:border-muted-foreground/30 placeholder:text-muted-foreground/50 placeholder:font-normal"
                  style={{ fontSize: "18px" }}
                  tabIndex={compareMode ? -1 : 0}
                />
                {rawInput && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 p-1.5 rounded-xl hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-90"
                    aria-label="Hapus"
                    tabIndex={compareMode ? -1 : 0}
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="px-1">
                <Slider
                  value={[rupiahToSlider(rupiah)]}
                  onValueChange={([pos]) => {
                    const val = sliderToRupiah(pos);
                    setActiveQuick(null);
                    setRawInput(val > 0 ? formatRupiah(val) : "");
                  }}
                  max={SLIDER_MAX}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground font-medium select-none">
                  <span>Rp 0</span><span>1 Jt</span><span>1 M</span><span>1 T</span>
                </div>
              </div>
              <div className="flex gap-2.5">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => handleQuick(q.value)}
                    tabIndex={compareMode ? -1 : 0}
                    className={`flex-1 h-11 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.95] hover:scale-[1.02] ${
                      activeQuick === q.value
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-2 border-primary/20 text-primary hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            className={`transition-all duration-300 ease-out ${
              compareMode
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-[0.97] pointer-events-none absolute inset-0"
            }`}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-muted-foreground font-bold text-xs select-none pointer-events-none">Rp</span>
                    <input
                      ref={compareMode ? inputRef : undefined}
                      type="text"
                      inputMode="numeric"
                      value={rawInput}
                      onChange={handleInput}
                      onPaste={handlePaste}
                      placeholder="Jumlah 1"
                      className="w-full h-11 pl-8 pr-7 rounded-xl border-2 border-border bg-card text-sm font-bold focus:outline-none focus:border-accent input-glow transition-all duration-200"
                      tabIndex={!compareMode ? -1 : 0}
                    />
                    {rawInput && (
                      <button onClick={handleClear} className="absolute right-2 p-0.5 rounded-lg hover:bg-muted transition-colors" aria-label="Hapus" tabIndex={!compareMode ? -1 : 0}>
                        <X size={14} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {QUICK_AMOUNTS.map((q) => (
                      <button
                        key={q.value}
                        onClick={() => handleQuick(q.value)}
                        tabIndex={!compareMode ? -1 : 0}
                        className={`flex-1 h-7 rounded-lg text-[10px] font-bold transition-all ${
                          activeQuick === q.value
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "border border-primary/30 text-primary hover:bg-primary/5"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-muted-foreground font-bold text-xs select-none pointer-events-none">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={rawInput2}
                      onChange={handleInput2}
                      placeholder="Jumlah 2"
                      className="w-full h-11 pl-8 pr-7 rounded-xl border-2 border-border bg-card text-sm font-bold focus:outline-none focus:border-accent input-glow transition-all duration-200"
                      tabIndex={!compareMode ? -1 : 0}
                    />
                    {rawInput2 && (
                      <button onClick={handleClear2} className="absolute right-2 p-0.5 rounded-lg hover:bg-muted transition-colors" aria-label="Hapus" tabIndex={!compareMode ? -1 : 0}>
                        <X size={14} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {QUICK_AMOUNTS.map((q) => (
                      <button
                        key={q.value}
                        onClick={() => handleQuick2(q.value)}
                        tabIndex={!compareMode ? -1 : 0}
                        className={`flex-1 h-7 rounded-lg text-[10px] font-bold transition-all ${
                          activeQuick2 === q.value
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "border border-primary/30 text-primary hover:bg-primary/5"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result — Normal mode */}
        <div className={`transition-all duration-300 ease-out ${!compareMode && debouncedRupiah > 0 ? "opacity-100 translate-y-0 max-h-[500px]" : "opacity-0 translate-y-4 max-h-0 overflow-hidden pointer-events-none"}`}>
          <div className="mt-6 space-y-3">
            <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} />

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  const p = getPrimaryResult(totalMs);
                  const text = `Rp ${inputFormatted} = ${p.value} ${p.unit} MBG`;
                  navigator.clipboard.writeText(text);
                }}
                className="h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-all duration-200"
              >
                <Copy size={15} />
                Salin Teks
              </button>
              <button
                onClick={handleSaveImage}
                disabled={saving}
                className="h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent shadow-md shadow-primary/15 hover:shadow-lg hover:scale-[1.01] active:scale-[0.97] transition-all duration-200 disabled:opacity-60"
              >
                <Download size={15} />
                {saving ? "Menyimpan..." : "Simpan Gambar"}
              </button>
            </div>
          </div>
        </div>

        {/* Result — Compare mode */}
        <div className={`transition-all duration-300 ease-out ${compareMode && (debouncedRupiah > 0 || debouncedRupiah2 > 0) ? "opacity-100 translate-y-0 max-h-[500px]" : "opacity-0 translate-y-4 max-h-0 overflow-hidden pointer-events-none"}`}>
          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {debouncedRupiah > 0 && (
                <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} compact />
              )}
              {debouncedRupiah2 > 0 && (
                <ResultCard rupiah={debouncedRupiah2} totalMs={totalMs2} inputFormatted={inputFormatted2} compact />
              )}
            </div>

            {debouncedRupiah > 0 && debouncedRupiah2 > 0 && (
              <Section>
                <p className="text-xs text-muted-foreground mb-1 text-center font-medium">Selisih</p>
                <p className="text-sm font-extrabold text-center">Rp {formatRupiah(Math.round(diffRupiah))}</p>
                <p className="text-sm font-bold text-result text-center">
                  = {getPrimaryResult(diffMs).value} {getPrimaryResult(diffMs).unit} MBG
                </p>
              </Section>
            )}
          </div>
        )}

        {/* Reverse Mode */}
        <Section className="mt-6">
          <button
            onClick={() => setReverseOpen((o) => !o)}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="font-bold text-sm group-hover:text-primary transition-colors">Mode Terbalik</span>
            <div className={`p-1 rounded-lg transition-all duration-200 ${reverseOpen ? "bg-muted" : ""}`}>
              {reverseOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {reverseOpen && (
            <div className="mt-4 space-y-3 animate-fade-in-up">
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={reverseValue}
                  onChange={(e) => setReverseValue(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="Jumlah"
                  className="flex-1 h-11 px-3 rounded-xl border-2 border-border bg-background text-base font-semibold focus:outline-none focus:border-accent input-glow transition-all duration-200"
                  style={{ fontSize: "16px" }}
                />
                <select
                  value={reverseUnit}
                  onChange={(e) => setReverseUnit(e.target.value)}
                  className="h-11 px-3 rounded-xl border-2 border-border bg-background text-sm font-semibold focus:outline-none focus:border-accent input-glow transition-all duration-200"
                >
                  {UNITS.map((u) => (
                    <option key={u.key} value={u.key}>{u.label}</option>
                  ))}
                </select>
              </div>
              {reverseRupiah > 0 && (
                <p className="text-lg font-extrabold text-result-glow animate-fade-in-up">
                  = Rp {formatRupiah(Math.round(reverseRupiah))}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* History */}
        {history.length > 0 && (
          <Section className="mt-4">
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="flex items-center justify-between w-full text-left group"
            >
              <span className="font-bold text-sm group-hover:text-primary transition-colors">
                Riwayat
                <span className="ml-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              </span>
              <div className="flex items-center gap-2">
                {historyOpen && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </span>
                )}
                <div className={`p-1 rounded-lg transition-all duration-200 ${historyOpen ? "bg-muted" : ""}`}>
                  {historyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </button>
            {historyOpen && (
              <HistoryList history={history} onTap={handleHistoryTap} />
            )}
          </Section>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-10 pb-5 text-center space-y-1">
          <p className="text-xs text-muted-foreground font-medium">made by M. Alfin</p>
          <p className="text-[11px] text-muted-foreground/70">
            Sumber data: Anggaran program MBG — Rp 71T/tahun ≈ Rp 1,2T/hari
          </p>
        </footer>
      </div>

      {/* Off-screen capture template */}
      <div
        ref={captureRef}
        style={{
          position: "absolute", left: "-9999px", top: 0, opacity: 0,
          width: 1080, height: 1080,
          background: "linear-gradient(180deg, #003366, #001a33)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 60,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ color: "white", textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 2 }}>KALKULATOR MBG</div>
          <div style={{ fontSize: 20, opacity: 0.8, marginTop: 8 }}>Makan Bergizi Gratis</div>
        </div>
        <div style={{
          background: "white", borderRadius: 24, padding: "48px 56px", width: "85%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#003366" }}>Rp {inputFormatted || "0"}</div>
          <div style={{ fontSize: 48, margin: "16px 0", color: "#888" }}>↓</div>
          {primary && (
            <div style={{ fontSize: 40, fontWeight: 800, color: "#FF6600" }}>
              {primary.value} {primary.unit} MBG
            </div>
          )}
        </div>
        <div style={{ color: "white", textAlign: "center", marginTop: 36, fontSize: 14 }}>
          <div style={{ opacity: 0.9 }}>Proyeksi biaya harian program MBG: Rp 1,2 Triliun/hari</div>
          <div style={{ opacity: 0.6, marginTop: 4, fontSize: 12 }}>Sumber: BGN (Badan Gizi Nasional)</div>
        </div>
        <div style={{ position: "absolute", bottom: 24, right: 40, color: "white", fontSize: 13, opacity: 0.7 }}>
          made by M. Alfin
        </div>
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", color: "white", fontSize: 11, opacity: 0.3 }}>
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
        .animate-fade-in-up { animation: fade-in-up 250ms ease-out; }
        .animate-slide-down { animation: slide-down 200ms ease-out; }
      `}</style>
    </div>
  );
}
