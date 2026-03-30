import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sun, Moon, X, Copy, Download, ChevronDown, ChevronUp, Trash2, ArrowLeftRight } from "lucide-react";
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

function getBreakdown(totalMs: number): { label: string; value: string }[] {
  return UNITS.map((u) => ({
    label: u.label,
    value: formatSigDigits(totalMs / u.ms),
  }));
}

// ─── Contextual comparisons ───
const COMPARISONS = [
  { emoji: "☕", label: "kopi", price: 25_000 },
  { emoji: "🍚", label: "nasi padang", price: 18_000 },
  { emoji: "⛽", label: "liter bensin", price: 12_500 },
  { emoji: "🎬", label: "tiket bioskop", price: 50_000 },
  { emoji: "💰", label: "bulan UMR Jakarta", price: 5_067_381 },
  { emoji: "🏠", label: "bulan kos Jakarta", price: 2_500_000 },
  { emoji: "📱", label: "iPhone 16", price: 16_499_000 },
  { emoji: "🏍️", label: "Honda Beat", price: 18_000_000 },
  { emoji: "🏠", label: "rumah subsidi", price: 150_000_000 },
];

function getContextualComparisons(rupiah: number): { emoji: string; text: string }[] {
  if (rupiah <= 0) return [];
  const results: { emoji: string; text: string }[] = [];
  for (const c of COMPARISONS) {
    const count = rupiah / c.price;
    if (count >= 0.1 && count <= 999_999) {
      const display = count >= 10 ? Math.round(count).toLocaleString("id-ID") : parseFloat(count.toFixed(1)).toLocaleString("id-ID");
      results.push({ emoji: c.emoji, text: `${display} ${c.label}` });
    }
    if (results.length >= 3) break;
  }
  return results;
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
  const contextual = useMemo(() => getContextualComparisons(rupiah), [rupiah]);
  const animatedMs = useAnimatedNumber(totalMs, 400);
  const primary = getPrimaryResult(animatedMs);
  const breakdown = getBreakdown(animatedMs);
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
    <div className={`relative rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-lg ${compact ? "p-3" : "p-5"} animate-fade-in-up transition-shadow duration-300`}>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Salin hasil"
      >
        <Copy size={compact ? 14 : 16} className="text-muted-foreground" />
      </button>

      {copied && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md shadow animate-slide-down">
          Tersalin!
        </div>
      )}

      <div className="text-center mb-4">
        {compact && (
          <div className="text-xs text-muted-foreground mb-1">Rp {inputFormatted}</div>
        )}
        <span className={`${compact ? "text-xl" : "text-3xl"} font-bold text-result tabular-nums`}>{primary.value}</span>
        <span className={`${compact ? "text-sm" : "text-lg"} font-semibold text-result ml-1.5`}>{primary.unit} MBG</span>
      </div>

      <div className="border-t pt-3 space-y-1">
        {breakdown.map((b) => (
          <div key={b.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{b.label}</span>
            <span className="font-medium tabular-nums">{b.value}</span>
          </div>
        ))}
      </div>

      {!compact && contextual.length > 0 && (
        <div className="border-t pt-3 mt-1">
          <p className="text-xs text-muted-foreground mb-2">Setara dengan:</p>
          <div className="flex flex-wrap gap-2">
            {contextual.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1.5 rounded-full font-medium">
                {c.emoji} {c.text}
              </span>
            ))}
          </div>
        </div>
      )}

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

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [rawInput2, setRawInput2] = useState("");
  const [activeQuick2, setActiveQuick2] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // History
  const { history, addToHistory, clearHistory } = useHistory();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const rupiah = useMemo(() => parseRupiahInput(rawInput), [rawInput]);
  const debouncedRupiah = useDebounce(rupiah, 150);
  const totalMs = useMemo(() => rupiahToMs(debouncedRupiah), [debouncedRupiah]);
  const inputFormatted = useMemo(() => (rupiah > 0 ? formatRupiah(rupiah) : ""), [rupiah]);

  // Compare mode derived
  const rupiah2 = useMemo(() => parseRupiahInput(rawInput2), [rawInput2]);
  const debouncedRupiah2 = useDebounce(rupiah2, 150);
  const totalMs2 = useMemo(() => rupiahToMs(debouncedRupiah2), [debouncedRupiah2]);
  const inputFormatted2 = useMemo(() => (rupiah2 > 0 ? formatRupiah(rupiah2) : ""), [rupiah2]);

  // Auto-save to history
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

  const handleQuick = useCallback((val: number) => {
    setActiveQuick(val);
    setRawInput(formatRupiah(val));
  }, []);

  const handleQuick2 = useCallback((val: number) => {
    setActiveQuick2(val);
    setRawInput2(formatRupiah(val));
  }, []);

  const handleClear = useCallback(() => {
    setRawInput("");
    setActiveQuick(null);
    inputRef.current?.focus();
  }, []);

  const handleClear2 = useCallback(() => {
    setRawInput2("");
    setActiveQuick2(null);
  }, []);

  const handleHistoryTap = useCallback((val: number) => {
    setRawInput(formatRupiah(val));
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

  // Comparison difference
  const diffMs = useMemo(() => Math.abs(totalMs - totalMs2), [totalMs, totalMs2]);
  const diffRupiah = useMemo(() => Math.abs(debouncedRupiah - debouncedRupiah2), [debouncedRupiah, debouncedRupiah2]);

  // Save as image
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

        {/* Mode Toggle */}
        <div className="flex items-center justify-center mt-3 mb-2">
          <div className="inline-flex rounded-lg border bg-muted p-0.5 text-sm">
            <button
              onClick={() => setCompareMode(false)}
              className={`px-4 py-1.5 rounded-md font-medium transition-all duration-200 ${!compareMode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Normal
            </button>
            <button
              onClick={() => setCompareMode(true)}
              className={`px-4 py-1.5 rounded-md font-medium transition-all duration-200 flex items-center gap-1.5 ${compareMode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ArrowLeftRight size={14} />
              Bandingkan
            </button>
          </div>
        </div>

        {/* Input Area */}
        {!compareMode ? (
          <div className="mt-3">
            {/* Single input */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted-foreground font-semibold text-lg select-none pointer-events-none">Rp</span>
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
                <button onClick={handleClear} className="absolute right-3 p-1 rounded-md hover:bg-muted transition-colors" aria-label="Hapus">
                  <X size={18} className="text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Slider */}
            <div className="mt-3 px-1">
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
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground select-none">
                <span>Rp 0</span><span>1 Jt</span><span>1 M</span><span>1 T</span>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 mt-3">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q.value}
                  onClick={() => handleQuick(q.value)}
                  className={`flex-1 h-11 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.95] hover:scale-[1.03] hover:shadow-md ${
                    activeQuick === q.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "border border-primary text-primary hover:bg-primary/10"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Compare mode — dual inputs */
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {/* Input 1 */}
              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-muted-foreground font-semibold text-sm select-none pointer-events-none">Rp</span>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={rawInput}
                    onChange={handleInput}
                    onPaste={handlePaste}
                    placeholder="Jumlah 1"
                    className="w-full h-11 pl-8 pr-7 rounded-lg border bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
                  />
                  {rawInput && (
                    <button onClick={handleClear} className="absolute right-2 p-0.5 rounded hover:bg-muted transition-colors" aria-label="Hapus">
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex gap-1 mt-1.5">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q.value}
                      onClick={() => handleQuick(q.value)}
                      className={`flex-1 h-7 rounded text-[10px] font-semibold transition-all ${
                        activeQuick === q.value
                          ? "bg-primary text-primary-foreground"
                          : "border border-primary/50 text-primary hover:bg-primary/10"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input 2 */}
              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-muted-foreground font-semibold text-sm select-none pointer-events-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rawInput2}
                    onChange={handleInput2}
                    placeholder="Jumlah 2"
                    className="w-full h-11 pl-8 pr-7 rounded-lg border bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
                  />
                  {rawInput2 && (
                    <button onClick={handleClear2} className="absolute right-2 p-0.5 rounded hover:bg-muted transition-colors" aria-label="Hapus">
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex gap-1 mt-1.5">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q.value}
                      onClick={() => handleQuick2(q.value)}
                      className={`flex-1 h-7 rounded text-[10px] font-semibold transition-all ${
                        activeQuick2 === q.value
                          ? "bg-primary text-primary-foreground"
                          : "border border-primary/50 text-primary hover:bg-primary/10"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {!compareMode && debouncedRupiah > 0 && (
          <div className="mt-5 space-y-3">
            <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} />
            <button
              onClick={handleSaveImage}
              disabled={saving}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
            >
              <Download size={16} />
              {saving ? "Menyimpan..." : "Simpan Gambar"}
            </button>
          </div>
        )}

        {/* Compare Results */}
        {compareMode && (debouncedRupiah > 0 || debouncedRupiah2 > 0) && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {debouncedRupiah > 0 && (
                <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} compact />
              )}
              {debouncedRupiah2 > 0 && (
                <ResultCard rupiah={debouncedRupiah2} totalMs={totalMs2} inputFormatted={inputFormatted2} compact />
              )}
            </div>

            {/* Difference */}
            {debouncedRupiah > 0 && debouncedRupiah2 > 0 && (
              <div className="rounded-lg border bg-card p-3 text-center animate-fade-in-up">
                <p className="text-xs text-muted-foreground mb-1">Selisih</p>
                <p className="text-sm font-bold">Rp {formatRupiah(Math.round(diffRupiah))}</p>
                <p className="text-sm font-semibold text-result">
                  = {getPrimaryResult(diffMs).value} {getPrimaryResult(diffMs).unit} MBG
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reverse Mode */}
        <div className="mt-6 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow duration-300">
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
                    <option key={u.key} value={u.key}>{u.label}</option>
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

        {/* History */}
        {history.length > 0 && (
          <div className="mt-4 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow duration-300">
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="font-semibold text-sm">Riwayat ({history.length})</span>
              <div className="flex items-center gap-2">
                {historyOpen && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                    Hapus
                  </span>
                )}
                {historyOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>
            {historyOpen && (
              <div className="mt-3 space-y-1.5 animate-fade-in-up">
                {history.map((entry) => {
                  const ms = rupiahToMs(entry.rupiah);
                  const res = getPrimaryResult(ms);
                  return (
                    <button
                      key={entry.timestamp}
                      onClick={() => handleHistoryTap(entry.rupiah)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      <span className="font-medium">Rp {formatRupiah(entry.rupiah)}</span>
                      <span className="text-result font-semibold text-xs">
                        {res.value} {res.unit}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
          <div style={{ borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />
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
        .animate-fade-in-up { animation: fade-in-up 200ms ease-out; }
        .animate-slide-down { animation: slide-down 200ms ease-out; }
        .text-result { color: hsl(var(--result)); }
      `}</style>
    </div>
  );
}
