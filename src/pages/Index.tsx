import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { Sun, Moon, X, Copy, Download, ChevronDown, ChevronUp, Trash2, ArrowLeftRight, Calculator, Info, Code2, Link2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useHistory } from "@/hooks/useHistory";
import { MBG_DAILY_COST, MBG_ANNUAL_BUDGET, MBG_COST_PER_PORSI, MBG_DATA_UPDATED, MBG_SOURCES } from "@/lib/mbg-constants";

// ─── Constants ───
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
  { label: "1 Jt", value: 1_000_000 },
  { label: "10 Jt", value: 10_000_000 },
  { label: "100 Jt", value: 100_000_000 },
];

const SLIDER_MAX = 100;
const LOG_MAX = 12;

function sliderToRupiah(pos: number): number {
  if (pos <= 0) return 0;
  return Math.round(Math.pow(10, (pos / SLIDER_MAX) * LOG_MAX));
}

function rupiahToSlider(rupiah: number): number {
  if (rupiah <= 0) return 0;
  return Math.min((Math.log10(rupiah) / LOG_MAX) * SLIDER_MAX, SLIDER_MAX);
}

function formatRupiah(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseRupiahInput(str: string): number {
  const digits = str.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// Format angka besar jadi ringkas: 1.250.000 → "1,25 Jt"
function formatCompact(num: number): string {
  if (!isFinite(num) || num <= 0) return "0";
  const tiers = [
    { v: 1e15, s: "Kuadriliun" },
    { v: 1e12, s: "T" },
    { v: 1e9, s: "M" },
    { v: 1e6, s: "Jt" },
    { v: 1e3, s: "Rb" },
  ];
  for (const t of tiers) {
    if (num >= t.v) {
      const val = num / t.v;
      const fixed = val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2);
      return `${fixed.replace(".", ",").replace(/,?0+$/, "")} ${t.s}`;
    }
  }
  return formatRupiah(Math.round(num));
}

// Terbilang Indonesia (mendukung sampai kuadriliun)
const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
function _terbilangSub(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${_terbilangSub(n - 10)} belas`;
  if (n < 100) return `${_terbilangSub(Math.floor(n / 10))} puluh${n % 10 ? " " + _terbilangSub(n % 10) : ""}`;
  if (n < 200) return `seratus${n - 100 ? " " + _terbilangSub(n - 100) : ""}`;
  if (n < 1000) return `${_terbilangSub(Math.floor(n / 100))} ratus${n % 100 ? " " + _terbilangSub(n % 100) : ""}`;
  if (n < 2000) return `seribu${n - 1000 ? " " + _terbilangSub(n - 1000) : ""}`;
  return "";
}
function terbilang(num: number): string {
  if (!isFinite(num) || num <= 0) return "";
  if (num > Number.MAX_SAFE_INTEGER) return "angka terlalu besar";
  const scales = [
    { v: 1e15, s: "kuadriliun" },
    { v: 1e12, s: "triliun" },
    { v: 1e9, s: "miliar" },
    { v: 1e6, s: "juta" },
    { v: 1e3, s: "ribu" },
  ];
  let rest = Math.floor(num);
  const parts: string[] = [];
  for (const { v, s } of scales) {
    if (rest >= v) {
      const q = Math.floor(rest / v);
      rest = rest % v;
      if (v === 1e3 && q === 1) parts.push("seribu");
      else parts.push(`${_terbilangSub(q)} ${s}`);
    }
  }
  if (rest > 0) parts.push(_terbilangSub(rest));
  return `${parts.join(" ")} rupiah`.replace(/\s+/g, " ").trim();
}

function rupiahToMs(rupiah: number): number {
  return (rupiah / MBG_DAILY_COST) * MS_PER_DAY;
}

function msToRupiah(ms: number): number {
  return (ms / MS_PER_DAY) * MBG_DAILY_COST;
}

function getPrimaryResult(totalMs: number): { value: string; unit: string } {
  for (const u of UNITS) {
    const val = totalMs / u.ms;
    if (val >= 0.01) {
      if (u.key === "hari" && val > 9999) {
        return { value: val.toExponential(2), unit: u.label };
      }
      return { value: formatRupiah(parseFloat(val.toFixed(2))), unit: u.label };
    }
  }
  return { value: "0", unit: "Milidetik" };
}

// ─── Hooks ───
function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("mbg-theme") === "dark";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("mbg-theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, useCallback(() => setDark((d) => !d), [])] as const;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Result Card ───
const ResultCard = React.memo(function ResultCard({
  rupiah, totalMs, inputFormatted, compact,
}: {
  rupiah: number; totalMs: number; inputFormatted: string; compact?: boolean;
}) {
  const animatedMs = useAnimatedNumber(totalMs, 400);
  const animatedRupiah = useAnimatedNumber(rupiah, 400);
  const primary = getPrimaryResult(animatedMs);
  const [copied, setCopied] = useState(false);
  const actualPrimary = getPrimaryResult(totalMs);

  const porsi = animatedRupiah / MBG_COST_PER_PORSI;
  const hariOperasional = animatedRupiah / MBG_DAILY_COST;
  const pctOfAnnual = (animatedRupiah / MBG_ANNUAL_BUDGET) * 100;
  const barPct = Math.min(pctOfAnnual, 100);

  const handleCopy = useCallback(() => {
    const porsiTxt = formatCompact(rupiah / MBG_COST_PER_PORSI);
    const hariTxt = formatCompact(rupiah / MBG_DAILY_COST);
    navigator.clipboard.writeText(
      `Rp ${inputFormatted} = ${porsiTxt} porsi MBG = ${hariTxt} hari operasional (${actualPrimary.value} ${actualPrimary.unit})`
    );
    setCopied(true);
    toast.success("Teks berhasil disalin!");
    setTimeout(() => setCopied(false), 1500);
  }, [inputFormatted, actualPrimary, rupiah]);

  if (rupiah <= 0) return null;

  return (
    <div className={`relative card-elevated rounded-2xl border-2 border-border animate-fade-in-up ${compact ? "p-3 sm:p-4" : "p-4 sm:p-6 result-glow"}`}>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-xl hover:bg-muted/80 transition-colors active:scale-95 z-10"
        aria-label="Salin hasil"
      >
        <Copy size={compact ? 13 : 15} className="text-muted-foreground" />
      </button>
      {copied && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-lg shadow-lg animate-slide-down font-medium">
          Tersalin!
        </div>
      )}

      {/* Headline */}
      <div className="text-center">
        {compact && <div className="text-[11px] text-muted-foreground mb-1.5 font-medium truncate">Rp {inputFormatted}</div>}
        <div className="flex items-baseline justify-center gap-1">
          <span className={`${compact ? "text-xl sm:text-2xl" : "text-4xl sm:text-5xl"} font-extrabold text-result-glow tabular-nums tracking-tight`}>
            {primary.value}
          </span>
          <span className={`${compact ? "text-xs sm:text-sm" : "text-base sm:text-xl"} font-bold text-result opacity-80`}>
            {primary.unit}
          </span>
        </div>
        <span className={`${compact ? "text-[10px]" : "text-xs sm:text-sm"} font-semibold text-result/70`}>operasional MBG</span>
      </div>

      {/* Stat grid + Bar (only non-compact) */}
      {!compact && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-5">
            <div className="rounded-xl bg-muted/40 border border-border/60 p-2.5 sm:p-3 text-center">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground font-bold mb-0.5">Porsi MBG</div>
              <div className="text-base sm:text-lg font-extrabold text-foreground tabular-nums">{formatCompact(porsi)}</div>
              <div className="text-[10px] text-muted-foreground">@ Rp 10rb/porsi</div>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/60 p-2.5 sm:p-3 text-center">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground font-bold mb-0.5">Hari Operasional</div>
              <div className="text-base sm:text-lg font-extrabold text-foreground tabular-nums">{formatCompact(hariOperasional)}</div>
              <div className="text-[10px] text-muted-foreground">@ Rp 1,2 T/hari</div>
            </div>
          </div>

          {/* APBN bar */}
          <div className="mt-4 sm:mt-5">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground font-bold">
                vs APBN MBG (Rp 71 T/tahun)
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-primary tabular-nums">
                {pctOfAnnual < 0.01
                  ? "<0,01%"
                  : pctOfAnnual >= 100
                    ? `${formatCompact(pctOfAnnual)}%`
                    : `${pctOfAnnual.toFixed(pctOfAnnual < 1 ? 2 : pctOfAnnual < 10 ? 1 : 0).replace(".", ",")}%`}
              </span>
            </div>
            <div className="h-2.5 sm:h-3 w-full rounded-full bg-muted/60 overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${barPct}%`, minWidth: barPct > 0 ? "4px" : "0" }}
              />
            </div>
            {pctOfAnnual > 100 && (
              <p className="text-[10px] text-accent font-semibold mt-1 text-center">
                Melebihi anggaran tahunan ({formatCompact(animatedRupiah / MBG_ANNUAL_BUDGET)}× lipat)
              </p>
            )}
          </div>
        </>
      )}

      {rupiah > Number.MAX_SAFE_INTEGER && (
        <p className="text-[10px] text-destructive mt-2 text-center">⚠ Melebihi batas presisi</p>
      )}
    </div>
  );
});

// ─── History List ───
const HistoryList = React.memo(function HistoryList({
  history, onTap,
}: {
  history: { rupiah: number; rupiah2?: number; type: "single" | "compare"; timestamp: number }[];
  onTap: (val: number, val2?: number, type?: "single" | "compare") => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? history : history.slice(0, 5);

  return (
    <div className="mt-2 space-y-0.5 animate-fade-in-up">
      {visible.map((entry) => {
        const res = getPrimaryResult(rupiahToMs(entry.rupiah));
        const isCompare = entry.type === "compare";
        const res2 = isCompare && entry.rupiah2 ? getPrimaryResult(rupiahToMs(entry.rupiah2)) : null;
        return (
          <button
            key={entry.timestamp}
            onClick={() => onTap(entry.rupiah, entry.rupiah2, entry.type)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-muted/60 transition-colors text-sm group active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`shrink-0 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isCompare ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
                {isCompare ? "VS" : "1x"}
              </span>
              <span className="font-semibold group-hover:text-primary transition-colors text-xs sm:text-sm truncate">
                {isCompare ? `${formatRupiah(entry.rupiah)} vs ${formatRupiah(entry.rupiah2!)}` : `Rp ${formatRupiah(entry.rupiah)}`}
              </span>
            </div>
            <span className="text-result font-bold text-[11px] sm:text-xs shrink-0 ml-2">
              {isCompare && res2 ? `${res.value} ${res.unit} / ${res2.value} ${res2.unit}` : `${res.value} ${res.unit}`}
            </span>
          </button>
        );
      })}
      {!showAll && history.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-xs text-accent font-semibold py-2 hover:bg-muted/60 rounded-xl transition-colors"
        >
          +{history.length - 5} lagi
        </button>
      )}
    </div>
  );
});

// ─── Section ───
const Section = React.memo(function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card-elevated rounded-2xl border-2 border-border p-4 sm:p-5 ${className}`}>{children}</div>;
});

// ─── Quick Buttons ───
const QuickButtons = React.memo(function QuickButtons({
  amounts, active, onSelect, compact, disabled,
}: {
  amounts: typeof QUICK_AMOUNTS; active: number | null; onSelect: (v: number) => void; compact?: boolean; disabled?: boolean;
}) {
  return (
    <div className={`flex ${compact ? "gap-1" : "gap-2"}`}>
      {amounts.map((q) => (
        <button
          key={q.value}
          onClick={() => onSelect(q.value)}
          tabIndex={disabled ? -1 : 0}
          className={`flex-1 ${compact ? "h-7 rounded-lg text-[10px]" : "h-10 sm:h-11 rounded-xl text-xs sm:text-sm"} font-bold transition-colors active:scale-[0.95] ${
            active === q.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : compact
                ? "border border-primary/30 text-primary hover:bg-primary/5"
                : "border-2 border-primary/20 text-primary hover:border-primary/40 hover:bg-primary/5"
          }`}
        >
          {q.label}
        </button>
      ))}
    </div>
  );
});

// ─── Main ───
export default function Index() {
  const [dark, toggleDark] = useTheme();
  const [searchParams] = useSearchParams();
  const [rawInput, setRawInput] = useState(() => {
    const a = parseInt(searchParams.get("amount") || "0", 10);
    return a > 0 ? formatRupiah(a) : "";
  });
  const [activeQuick, setActiveQuick] = useState<number | null>(null);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reverseValue, setReverseValue] = useState("");
  const [reverseUnit, setReverseUnit] = useState("detik");
  const [saving, setSaving] = useState(false);
  const [saveRatio, setSaveRatio] = useState<"1:1" | "9:16" | "16:9">("1:1");
  const [embedOpen, setEmbedOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const [compareMode, setCompareMode] = useState(() => !!searchParams.get("compare"));
  const [rawInput2, setRawInput2] = useState(() => {
    const a = parseInt(searchParams.get("compare") || "0", 10);
    return a > 0 ? formatRupiah(a) : "";
  });
  const [activeQuick2, setActiveQuick2] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { history, addToHistory, clearHistory } = useHistory();

  useEffect(() => { if (!rawInput) inputRef.current?.focus(); }, []);

  const rupiah = useMemo(() => parseRupiahInput(rawInput), [rawInput]);
  const debouncedRupiah = useDebounce(rupiah, 150);
  const totalMs = useMemo(() => rupiahToMs(debouncedRupiah), [debouncedRupiah]);
  const inputFormatted = useMemo(() => (rupiah > 0 ? formatRupiah(rupiah) : ""), [rupiah]);

  const rupiah2 = useMemo(() => parseRupiahInput(rawInput2), [rawInput2]);
  const debouncedRupiah2 = useDebounce(rupiah2, 150);
  const totalMs2 = useMemo(() => rupiahToMs(debouncedRupiah2), [debouncedRupiah2]);
  const inputFormatted2 = useMemo(() => (rupiah2 > 0 ? formatRupiah(rupiah2) : ""), [rupiah2]);

  const prevDebouncedRef = useRef("");
  useEffect(() => {
    const key = compareMode
      ? (debouncedRupiah > 0 && debouncedRupiah2 > 0 ? `${debouncedRupiah}-${debouncedRupiah2}` : "")
      : (debouncedRupiah > 0 ? `${debouncedRupiah}` : "");
    if (key && key !== prevDebouncedRef.current) {
      prevDebouncedRef.current = key;
      if (compareMode) {
        addToHistory(debouncedRupiah, debouncedRupiah2);
      } else {
        addToHistory(debouncedRupiah);
      }
    }
  }, [debouncedRupiah, debouncedRupiah2, compareMode, addToHistory]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setActiveQuick(null);
    setRawInput(digits ? formatRupiah(parseInt(digits, 10)) : "");
  }, []);

  const handleInput2 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setActiveQuick2(null);
    setRawInput2(digits ? formatRupiah(parseInt(digits, 10)) : "");
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
  const handleHistoryTap = useCallback((val: number, val2?: number, type?: "single" | "compare") => {
    if (type === "compare" && val2) {
      setCompareMode(true);
      setRawInput(formatRupiah(val));
      setRawInput2(formatRupiah(val2));
      setActiveQuick(null);
      setActiveQuick2(null);
    } else {
      setRawInput(formatRupiah(val));
      setActiveQuick(null);
      inputRef.current?.focus();
    }
  }, []);

  const reverseRupiah = useMemo(() => {
    const num = parseFloat(reverseValue);
    if (!num || num < 0) return 0;
    const unit = UNITS.find((u) => u.key === reverseUnit);
    return unit ? msToRupiah(num * unit.ms) : 0;
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
      if (compareMode && debouncedRupiah > 0 && debouncedRupiah2 > 0) {
        addToHistory(debouncedRupiah, debouncedRupiah2);
      } else if (debouncedRupiah > 0) {
        addToHistory(debouncedRupiah);
      }
      toast.success("Gambar berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh gambar");
    } finally { setSaving(false); }
  }, [saving, debouncedRupiah, debouncedRupiah2, compareMode, addToHistory]);

  const primary = useMemo(() => (debouncedRupiah > 0 ? getPrimaryResult(totalMs) : null), [debouncedRupiah, totalMs]);

  const modeTransition = "transition-all duration-300 ease-out will-change-[opacity,transform]";

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/60" style={{ background: "hsl(var(--header-bg))", backdropFilter: "blur(12px)" }}>
        <div className="w-full max-w-[440px] mx-auto px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Calculator size={16} className="text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Kalkulator MBG</h1>
          </div>
          <button
            onClick={toggleDark}
            className="p-2 sm:p-2.5 rounded-xl border-2 border-border bg-card hover:bg-muted transition-colors active:scale-95 shadow-sm"
            aria-label="Toggle tema"
          >
            {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-muted-foreground" />}
          </button>
        </div>
      </header>

      <main className="w-full max-w-[440px] mx-auto px-4 sm:px-5 py-6 sm:py-8 flex-1 flex flex-col">
        <h2 className="sr-only">Kalkulator Konversi Rupiah ke Waktu MBG</h2>

        {/* Mode Toggle */}
        <div className="flex items-center justify-center mb-4 sm:mb-5">
          <div className="inline-flex rounded-xl border bg-muted/50 p-0.5 sm:p-1 text-sm">
            <button
              onClick={() => setCompareMode(false)}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                !compareMode ? "bg-card text-foreground shadow-md" : "text-muted-foreground"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setCompareMode(true)}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold transition-all flex items-center gap-1 text-xs sm:text-sm ${
                compareMode ? "bg-card text-foreground shadow-md" : "text-muted-foreground"
              }`}
            >
              <ArrowLeftRight size={13} />
              Bandingkan
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative">
          {/* Normal mode */}
          <div className={`${modeTransition} ${!compareMode ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none absolute inset-0"}`}>
            <div className="space-y-3 sm:space-y-4">
              <div className="relative flex items-center group">
                <span className="absolute left-3.5 sm:left-4 text-muted-foreground font-bold text-sm sm:text-base select-none pointer-events-none transition-colors group-focus-within:text-primary">
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
                  aria-label="Jumlah Rupiah"
                  className="w-full h-12 sm:h-14 pl-10 sm:pl-11 pr-10 sm:pr-11 rounded-2xl border-2 border-border bg-card text-base sm:text-lg font-bold focus:outline-none focus:border-accent input-glow transition-colors placeholder:text-foreground/40 placeholder:font-normal"
                  tabIndex={compareMode ? -1 : 0}
                />
                {rawInput && (
                  <button onClick={handleClear} className="absolute right-2.5 sm:right-3 p-1.5 rounded-xl hover:bg-muted transition-colors active:scale-90" aria-label="Hapus" tabIndex={compareMode ? -1 : 0}>
                    <X size={15} className="text-muted-foreground" />
                  </button>
                )}
              </div>
              {rupiah > 0 && (
                <p className="px-1 -mt-1 text-[11px] sm:text-xs text-muted-foreground italic capitalize animate-fade-in-up" aria-live="polite">
                  {terbilang(rupiah)}
                </p>
              )}
              <div className="px-0.5 sm:px-1">
                <Slider
                  value={[rupiahToSlider(rupiah)]}
                  onValueChange={([pos]) => {
                    setActiveQuick(null);
                    const val = sliderToRupiah(pos);
                    setRawInput(val > 0 ? formatRupiah(val) : "");
                  }}
                  max={SLIDER_MAX}
                  step={0.5}
                  className="w-full touch-pan-y"
                />
                <div className="flex justify-between mt-1 text-[9px] sm:text-[10px] text-muted-foreground font-medium select-none">
                  <span>Rp 0</span><span>1 Jt</span><span>1 M</span><span>1 T</span>
                </div>
              </div>
              <QuickButtons amounts={QUICK_AMOUNTS} active={activeQuick} onSelect={handleQuick} disabled={compareMode} />
            </div>
          </div>

          {/* Compare mode */}
          <div className={`${modeTransition} ${compareMode ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none absolute inset-0"}`}>
            <div className="space-y-2 sm:space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 sm:left-2.5 text-muted-foreground font-bold text-[11px] sm:text-xs select-none pointer-events-none">Rp</span>
                    <input
                      ref={compareMode ? inputRef : undefined}
                      type="text" inputMode="numeric" value={rawInput} onChange={handleInput} onPaste={handlePaste}
                      placeholder="Jumlah 1"
                      aria-label="Jumlah Rupiah pertama"
                      className="w-full h-10 sm:h-11 pl-7 sm:pl-8 pr-6 sm:pr-7 rounded-xl border-2 border-border bg-card text-xs sm:text-sm font-bold focus:outline-none focus:border-accent input-glow transition-colors"
                      tabIndex={!compareMode ? -1 : 0}
                    />
                    {rawInput && (
                      <button onClick={handleClear} className="absolute right-1.5 sm:right-2 p-0.5 rounded-lg hover:bg-muted transition-colors" aria-label="Hapus" tabIndex={!compareMode ? -1 : 0}>
                        <X size={13} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <QuickButtons amounts={QUICK_AMOUNTS} active={activeQuick} onSelect={handleQuick} compact disabled={!compareMode} />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 sm:left-2.5 text-muted-foreground font-bold text-[11px] sm:text-xs select-none pointer-events-none">Rp</span>
                    <input
                      type="text" inputMode="numeric" value={rawInput2} onChange={handleInput2}
                      placeholder="Jumlah 2"
                      aria-label="Jumlah Rupiah kedua"
                      className="w-full h-10 sm:h-11 pl-7 sm:pl-8 pr-6 sm:pr-7 rounded-xl border-2 border-border bg-card text-xs sm:text-sm font-bold focus:outline-none focus:border-accent input-glow transition-colors"
                      tabIndex={!compareMode ? -1 : 0}
                    />
                    {rawInput2 && (
                      <button onClick={handleClear2} className="absolute right-1.5 sm:right-2 p-0.5 rounded-lg hover:bg-muted transition-colors" aria-label="Hapus" tabIndex={!compareMode ? -1 : 0}>
                        <X size={13} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <QuickButtons amounts={QUICK_AMOUNTS} active={activeQuick2} onSelect={handleQuick2} compact disabled={!compareMode} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result — Normal */}
        <div className={`${modeTransition} ${!compareMode && debouncedRupiah > 0 ? "opacity-100 translate-y-0 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}>
          <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
            <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const p = getPrimaryResult(totalMs);
                  navigator.clipboard.writeText(`Rp ${inputFormatted} = ${p.value} ${p.unit} MBG`);
                  toast.success("Teks berhasil disalin!");
                  if (debouncedRupiah > 0) addToHistory(debouncedRupiah);
                }}
                className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors"
              >
                <Copy size={14} />
                Salin Teks
              </button>
              <button
                onClick={handleSaveImage}
                disabled={saving}
                className="h-10 sm:h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-accent shadow-md shadow-primary/15 active:scale-[0.97] transition-colors disabled:opacity-60"
              >
                <Download size={14} />
                {saving ? "Menyimpan..." : "Simpan Gambar"}
              </button>
            </div>
          </div>
        </div>

        {/* Result — Compare */}
        <div className={`${modeTransition} ${compareMode && (debouncedRupiah > 0 || debouncedRupiah2 > 0) ? "opacity-100 translate-y-0 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}>
          <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {debouncedRupiah > 0 && <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} compact />}
              {debouncedRupiah2 > 0 && <ResultCard rupiah={debouncedRupiah2} totalMs={totalMs2} inputFormatted={inputFormatted2} compact />}
            </div>
            {debouncedRupiah > 0 && debouncedRupiah2 > 0 && (
              <Section>
                <p className="text-[11px] text-muted-foreground mb-0.5 text-center font-medium">Selisih</p>
                <p className="text-xs sm:text-sm font-extrabold text-center">Rp {formatRupiah(Math.round(diffRupiah))}</p>
                <p className="text-xs sm:text-sm font-bold text-result text-center">
                  = {getPrimaryResult(diffMs).value} {getPrimaryResult(diffMs).unit} MBG
                </p>
              </Section>
            )}
          </div>
        </div>

        {/* Reverse Mode */}
        <Section className="mt-4 sm:mt-6">
          <button onClick={() => setReverseOpen((o) => !o)} className="flex items-center justify-between w-full text-left group" aria-expanded={reverseOpen}>
            <h2 className="font-bold text-xs sm:text-sm group-hover:text-primary transition-colors">Mode Terbalik</h2>
            <div className={`p-1 rounded-lg transition-colors ${reverseOpen ? "bg-muted" : ""}`}>
              {reverseOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
          </button>
          {reverseOpen && (
            <div className="mt-3 sm:mt-4 space-y-2.5 animate-fade-in-up">
              <div className="flex gap-2">
                <input
                  type="text" inputMode="decimal" value={reverseValue}
                  onChange={(e) => setReverseValue(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="Jumlah"
                  aria-label="Jumlah waktu"
                  className="flex-1 h-10 sm:h-11 px-3 rounded-xl border-2 border-border bg-background text-sm sm:text-base font-semibold focus:outline-none focus:border-accent input-glow transition-colors"
                />
                <select
                  value={reverseUnit} onChange={(e) => setReverseUnit(e.target.value)}
                  aria-label="Satuan waktu"
                  className="h-10 sm:h-11 px-2 sm:px-3 rounded-xl border-2 border-border bg-background text-xs sm:text-sm font-semibold focus:outline-none focus:border-accent transition-colors"
                >
                  {UNITS.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
                </select>
              </div>
              {reverseRupiah > 0 && (
                <p className="text-base sm:text-lg font-extrabold text-result-glow animate-fade-in-up">
                  = Rp {formatRupiah(Math.round(reverseRupiah))}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* History */}
        {history.length > 0 && (
          <Section className="mt-3 sm:mt-4">
            <button onClick={() => setHistoryOpen((o) => !o)} className="flex items-center justify-between w-full text-left group" aria-expanded={historyOpen}>
              <h2 className="font-bold text-xs sm:text-sm group-hover:text-primary transition-colors">
                Riwayat
                <span className="ml-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {historyOpen && (
                  <span role="button" onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                    className="flex items-center gap-0.5 text-[11px] sm:text-xs text-muted-foreground hover:text-destructive transition-colors font-medium">
                    <Trash2 size={11} /> Hapus
                  </span>
                )}
                <div className={`p-1 rounded-lg transition-colors ${historyOpen ? "bg-muted" : ""}`}>
                  {historyOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </div>
            </button>
            {historyOpen && <HistoryList history={history} onTap={handleHistoryTap} />}
          </Section>
        )}

        {/* Footer */}
        </main>
        <footer className="border-t border-border/60 py-4 sm:py-5 text-center space-y-0.5" style={{ background: "hsl(var(--footer-bg))" }}>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">made by M. Alfin</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground/70">
            Sumber data: Anggaran program MBG — Rp 71T/tahun ≈ Rp 1,2T/hari
          </p>
        </footer>

      {/* Off-screen capture */}
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
