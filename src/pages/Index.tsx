import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";

import { useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { Sun, Moon, X, Copy, Download, ChevronDown, ChevronUp, Trash2, ArrowLeftRight, Calculator, Info, Code2, Link2, History } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useHistory } from "@/hooks/useHistory";
import { MBG_DAILY_COST, MBG_COST_PER_PORSI, MBG_DATA_UPDATED, MBG_SOURCES } from "@/lib/mbg-constants";
import { terbilang } from "@/lib/terbilang";

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

// ─── Result Card ───
const ResultCard = React.memo(function ResultCard({
  rupiah, totalMs, inputFormatted, compact,
}: {
  rupiah: number; totalMs: number; inputFormatted: string; compact?: boolean;
}) {
  const animatedMs = useAnimatedNumber(totalMs, 400);
  
  const primary = getPrimaryResult(animatedMs);
  const [copied, setCopied] = useState(false);
  const actualPrimary = getPrimaryResult(totalMs);




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

  

  return (
    <div className={`relative card-elevated rounded-2xl border-2 border-border animate-fade-in-up ${compact ? "p-3 sm:p-4" : "p-4 sm:p-6 result-glow"}`}>

      {/* Headline */}
      <div className="text-center">
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
  const [reverseMode, setReverseMode] = useState(false);
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
  const debouncedRupiah = rupiah;
  const totalMs = useMemo(() => rupiahToMs(debouncedRupiah), [debouncedRupiah]);
  const inputFormatted = useMemo(() => (rupiah > 0 ? formatRupiah(rupiah) : ""), [rupiah]);

  const rupiah2 = useMemo(() => parseRupiahInput(rawInput2), [rawInput2]);
  const debouncedRupiah2 = rupiah2;
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

  // URL sync removed — was causing perceived "auto refresh" / focus jitter in preview iframe.
  // Deep-link initial load still works from ?amount=...&compare=... on mount.
  // Share/Embed buttons build their own URL on demand.

  // Konfeti milestone (1T / 10T / 71T)
  const firedMilestones = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (debouncedRupiah === 0) { firedMilestones.current.clear(); return; }
    const thresholds = [1e12, 1e13, 71e12];
    for (const t of thresholds) {
      if (debouncedRupiah >= t && !firedMilestones.current.has(t)) {
        firedMilestones.current.add(t);
        const intensity = t === 71e12 ? 200 : t === 1e13 ? 130 : 80;
        confetti({
          particleCount: intensity, spread: 75, origin: { y: 0.35 },
          colors: ["#003366", "#FF6600", "#FFD700", "#0066CC"],
        });
        if (t === 71e12) toast.success("🎉 Anggaran tahunan MBG terpenuhi!");
        else if (t === 1e13) toast.success("🎊 Rp 10 Triliun!");
        else toast.success("🎈 Rp 1 Triliun!");
      }
    }
  }, [debouncedRupiah]);

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

  const handleSaveImage = useCallback(async (ratio: "1:1" | "9:16" | "16:9" = "1:1") => {
    if (!captureRef.current || saving) return;
    setSaveRatio(ratio);
    setSaving(true);
    // Allow re-render with new dimensions
    await new Promise((r) => setTimeout(r, 50));
    try {
      const dims = ratio === "1:1" ? { w: 1080, h: 1080 } : ratio === "9:16" ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 };
      const html2canvas = (await import("html2canvas")).default;
      captureRef.current.style.left = "0";
      captureRef.current.style.opacity = "1";
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, width: dims.w, height: dims.h, backgroundColor: null, useCORS: true,
      });
      captureRef.current.style.left = "-9999px";
      captureRef.current.style.opacity = "0";
      const link = document.createElement("a");
      link.download = `kalkulator-mbg-${ratio.replace(":", "x")}-${Date.now()}.png`;
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

  const handleCopyLink = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedRupiah > 0) params.set("amount", String(debouncedRupiah));
    if (compareMode && debouncedRupiah2 > 0) params.set("compare", String(debouncedRupiah2));
    const url = `${window.location.origin}${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
    navigator.clipboard.writeText(url);
    toast.success("Tautan disalin!");
  }, [debouncedRupiah, debouncedRupiah2, compareMode]);

  const handleCopyCompare = useCallback(() => {
    const p1 = getPrimaryResult(totalMs);
    const p2 = getPrimaryResult(totalMs2);
    const pd = getPrimaryResult(diffMs);
    const txt =
      `Bandingkan biaya MBG:\n` +
      `• Rp ${formatRupiah(debouncedRupiah)} = ${p1.value} ${p1.unit}\n` +
      `• Rp ${formatRupiah(debouncedRupiah2)} = ${p2.value} ${p2.unit}\n` +
      `Selisih: Rp ${formatRupiah(Math.round(diffRupiah))} = ${pd.value} ${pd.unit} MBG`;
    navigator.clipboard.writeText(txt);
    toast.success("Teks berhasil disalin!");
    if (debouncedRupiah > 0 && debouncedRupiah2 > 0) addToHistory(debouncedRupiah, debouncedRupiah2);
  }, [debouncedRupiah, debouncedRupiah2, totalMs, totalMs2, diffMs, diffRupiah, addToHistory]);

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
            <p className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Kalkulator MBG</p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl border-2 border-border bg-card hover:bg-muted transition-colors active:scale-95 shadow-sm"
                aria-label="Buka riwayat"
              >
                <History size={17} className="text-muted-foreground" />
              </button>
            )}

            <button
              onClick={toggleDark}
              className="p-2 sm:p-2.5 rounded-xl border-2 border-border bg-card hover:bg-muted transition-colors active:scale-95 shadow-sm"
              aria-label="Toggle tema"
            >
              {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-muted-foreground" />}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[440px] mx-auto px-4 sm:px-5 py-6 sm:py-8 flex-1 flex flex-col">
        <h1 className="sr-only">Kalkulator Konversi Rupiah ke Program MBG</h1>


        {/* Mode Toggle */}
        <div className="flex items-center justify-center mb-4 sm:mb-5">
          <div className="inline-flex rounded-xl border-2 border-primary/15 bg-muted/50 p-0.5 sm:p-1 text-sm shadow-sm">
            <button
              onClick={() => { setCompareMode(false); setReverseMode(false); }}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                !compareMode && !reverseMode ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-muted-foreground hover:text-primary"
              }`}
            >
              Hitung
            </button>
            <button
              onClick={() => { setCompareMode(true); setReverseMode(false); }}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                compareMode ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-muted-foreground hover:text-primary"
              }`}
            >
              Selisih
            </button>
            <button
              onClick={() => { setReverseMode(true); setCompareMode(false); }}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                reverseMode ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-muted-foreground hover:text-primary"
              }`}
            >
              Balik
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative">
          {/* Normal mode */}
          <div className={`${modeTransition} ${!compareMode && !reverseMode ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none absolute inset-0"}`}>
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
        <div className={`${modeTransition} ${!compareMode && !reverseMode ? "opacity-100 translate-y-0 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}>
          <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
            <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} />
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const p = getPrimaryResult(totalMs);
                  navigator.clipboard.writeText(`Rp ${inputFormatted} = ${p.value} ${p.unit} MBG`);
                  toast.success("Teks berhasil disalin!");
                  if (debouncedRupiah > 0) addToHistory(debouncedRupiah);
                }}
                aria-label="Salin teks hasil ke clipboard"
                className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Copy size={13} aria-hidden="true" />
                Teks
              </button>
              <button
                onClick={handleCopyLink}
                aria-label="Salin tautan hasil ke clipboard"
                className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Link2 size={13} aria-hidden="true" />
                Link
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={saving}
                    aria-label="Simpan hasil sebagai gambar, pilih rasio"
                    className="h-10 sm:h-11 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:bg-accent shadow-md shadow-primary/15 active:scale-[0.97] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Download size={13} aria-hidden="true" />
                    {saving ? "..." : "PNG"}
                    <ChevronDown size={11} className="opacity-70" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44" loop>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("1:1"); }} aria-label="Simpan gambar rasio 1:1 untuk Instagram Feed, 1080 × 1080" className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    <div className="flex flex-col"><span className="font-semibold text-xs">1:1 — IG Feed</span><span className="text-[10px] text-muted-foreground">1080 × 1080</span></div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("9:16"); }} aria-label="Simpan gambar rasio 9:16 untuk Story atau Reels, 1080 × 1920" className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    <div className="flex flex-col"><span className="font-semibold text-xs">9:16 — Story / Reels</span><span className="text-[10px] text-muted-foreground">1080 × 1920</span></div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("16:9"); }} aria-label="Simpan gambar rasio 16:9 untuk Twitter atau Web, 1920 × 1080" className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    <div className="flex flex-col"><span className="font-semibold text-xs">16:9 — Twitter / Web</span><span className="text-[10px] text-muted-foreground">1920 × 1080</span></div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>
        </div>

        {/* Result — Compare */}
        <div className={`${modeTransition} ${compareMode ? "opacity-100 translate-y-0 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}>
          <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} inputFormatted={inputFormatted} compact />
              <ResultCard rupiah={debouncedRupiah2} totalMs={totalMs2} inputFormatted={inputFormatted2} compact />
            </div>
            <Section>
              <p className="text-[11px] text-muted-foreground mb-0.5 text-center font-medium">Selisih</p>
              <p className="text-xs sm:text-sm font-extrabold text-center">Rp {formatRupiah(Math.round(diffRupiah))}</p>
              <p className="text-xs sm:text-sm font-bold text-result text-center">
                = {getPrimaryResult(diffMs).value} {getPrimaryResult(diffMs).unit} MBG
              </p>
            </Section>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCopyCompare}
                aria-label="Salin teks perbandingan ke clipboard"
                className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
                disabled={!(debouncedRupiah > 0 && debouncedRupiah2 > 0)}
              >
                <Copy size={13} aria-hidden="true" />
                Teks
              </button>
              <button
                onClick={handleCopyLink}
                aria-label="Salin tautan perbandingan ke clipboard"
                className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
                disabled={!(debouncedRupiah > 0 && debouncedRupiah2 > 0)}
              >
                <Link2 size={13} aria-hidden="true" />
                Link
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={saving || !(debouncedRupiah > 0 && debouncedRupiah2 > 0)}
                    aria-label="Simpan perbandingan sebagai gambar, pilih rasio"
                    className="h-10 sm:h-11 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:bg-accent shadow-md shadow-primary/15 active:scale-[0.97] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Download size={13} aria-hidden="true" />
                    {saving ? "..." : "PNG"}
                    <ChevronDown size={11} className="opacity-70" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44" loop>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("1:1"); }} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    <div className="flex flex-col"><span className="font-semibold text-xs">1:1 — IG Feed</span><span className="text-[10px] text-muted-foreground">1080 × 1080</span></div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("9:16"); }} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    <div className="flex flex-col"><span className="font-semibold text-xs">9:16 — Story / Reels</span><span className="text-[10px] text-muted-foreground">1080 × 1920</span></div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("16:9"); }} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    <div className="flex flex-col"><span className="font-semibold text-xs">16:9 — Twitter / Web</span><span className="text-[10px] text-muted-foreground">1920 × 1080</span></div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Reverse Mode — its own tab */}
        <div className={`${modeTransition} ${reverseMode ? "opacity-100 translate-y-0 max-h-[600px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`} aria-hidden={!reverseMode}>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1 flex items-center group">
                <input
                  type="text" inputMode="decimal" value={reverseValue}
                  onChange={(e) => setReverseValue(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="Ketik jumlah..."
                  aria-label="Jumlah waktu"
                  tabIndex={reverseMode ? 0 : -1}
                  className="w-full h-12 sm:h-14 px-3.5 sm:px-4 rounded-2xl border-2 border-border bg-card text-base sm:text-lg font-bold focus:outline-none focus:border-accent input-glow transition-colors placeholder:text-foreground/40 placeholder:font-normal"
                />
              </div>
              <select
                value={reverseUnit} onChange={(e) => setReverseUnit(e.target.value)}
                aria-label="Satuan waktu"
                tabIndex={reverseMode ? 0 : -1}
                className="h-12 sm:h-14 px-3 sm:px-4 rounded-2xl border-2 border-border bg-card text-sm sm:text-base font-bold text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                {UNITS.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
              </select>
            </div>

            <div className={`relative card-elevated rounded-2xl border-2 border-border p-4 sm:p-6 result-glow animate-fade-in-up`}>
              <div className="text-center">
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Setara dengan</p>
                <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-result/70">Rp</span>
                  <span className="text-3xl sm:text-4xl font-extrabold text-result-glow tabular-nums tracking-tight">
                    {formatRupiah(Math.round(reverseRupiah))}
                  </span>
                </div>
                {reverseRupiah > 0 && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground italic capitalize mt-2 leading-snug">
                    {terbilang(Math.round(reverseRupiah))} rupiah
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (reverseRupiah <= 0) return;
                const unitLabel = UNITS.find((u) => u.key === reverseUnit)?.label.toLowerCase() ?? "";
                navigator.clipboard.writeText(
                  `${reverseValue} ${unitLabel} MBG = Rp ${formatRupiah(Math.round(reverseRupiah))}`
                );
                toast.success("Teks berhasil disalin!");
              }}
              disabled={reverseRupiah <= 0}
              aria-label="Salin hasil ke clipboard"
              className="w-full h-10 sm:h-11 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 hover:bg-accent shadow-md shadow-primary/15 active:scale-[0.97] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Copy size={13} aria-hidden="true" />
              Salin Teks
            </button>
          </div>
        </div>



        {/* History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="leading-none">Riwayat</DialogTitle>
              <DialogDescription className="sr-only">Daftar perhitungan terakhir Anda</DialogDescription>
            </DialogHeader>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                aria-label="Hapus semua riwayat"
                className="absolute right-12 top-4 inline-flex items-center justify-center h-4 w-4 rounded-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {history.length > 0 ? (
              <HistoryList
                history={history}
                onTap={(v, v2, t) => { handleHistoryTap(v, v2, t); setHistoryOpen(false); }}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada riwayat</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        </main>
        <footer className="border-t-2 border-primary/15 py-3 px-4" style={{ background: "hsl(var(--footer-bg))" }}>
          <div className="flex items-center justify-center gap-2 flex-wrap text-[10px] sm:text-[11px] text-primary/80 font-medium">
            <span>made by <span className="font-bold text-primary">M. Alfin</span></span>
            <span className="text-muted-foreground/50">·</span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Lihat sumber data dan patokan kalkulator"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors font-semibold underline underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Info size={11} aria-hidden="true" /> Sumber data
                </button>
              </PopoverTrigger>

              <PopoverContent align="center" className="w-72 text-xs space-y-2">
                <p className="font-bold text-sm">Patokan kalkulator</p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>• <strong className="text-foreground">Rp 71 T/tahun</strong> — anggaran MBG (Perpres 201/2024, APBN 2025).</li>
                  <li>• <strong className="text-foreground">Rp 1,2 T/hari</strong> — turunan rata-rata hari aktif sekolah.</li>
                  <li>• <strong className="text-foreground">Rp 10.000/porsi</strong> — standar BGN.</li>
                </ul>
                <div className="pt-1.5 border-t border-border space-y-1">
                  <p className="text-[10px] text-muted-foreground">Update: {MBG_DATA_UPDATED}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {MBG_SOURCES.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                         className="text-[10px] text-primary hover:underline font-semibold">{s.label}</a>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground/50">·</span>
            <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
              <DialogTrigger asChild>
                <button
                  aria-label="Buka dialog snippet sematkan iframe kalkulator"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors font-semibold underline underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Code2 size={11} aria-hidden="true" /> Sematkan
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Sematkan Kalkulator MBG</DialogTitle>
                  <DialogDescription>Salin snippet di bawah ke halaman/blog Anda.</DialogDescription>
                </DialogHeader>
                {(() => {
                  const params = new URLSearchParams();
                  if (debouncedRupiah > 0) params.set("amount", String(debouncedRupiah));
                  const snippet = `<iframe src="https://mbgcal.lovable.app/embed${params.toString() ? "?" + params.toString() : ""}" width="440" height="520" style="border:0;border-radius:16px;max-width:100%" loading="lazy" title="Kalkulator MBG"></iframe>`;
                  return (
                    <div className="space-y-2">
                      <pre className="text-[10px] sm:text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">{snippet}</pre>
                      <button
                        onClick={() => { navigator.clipboard.writeText(snippet); toast.success("Snippet disalin!"); }}
                        aria-label="Salin snippet iframe sematkan ke clipboard"
                        className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-accent transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >Salin snippet</button>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </div>
        </footer>

      {/* Off-screen capture (ratio: 1:1, 9:16, 16:9) */}
      {(() => {
        const dims = saveRatio === "1:1" ? { w: 1080, h: 1080 } : saveRatio === "9:16" ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 };
        const isWide = saveRatio === "16:9";
        return (
          <div
            ref={captureRef}
            style={{
              position: "absolute", left: "-9999px", top: 0, opacity: 0,
              width: dims.w, height: dims.h,
              background: "linear-gradient(180deg, #003366, #001a33)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: isWide ? 48 : 60,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            <div style={{ color: "white", textAlign: "center", marginBottom: isWide ? 24 : 40 }}>
              <div style={{ fontSize: isWide ? 32 : 36, fontWeight: 800, letterSpacing: 2 }}>KALKULATOR MBG</div>
              <div style={{ fontSize: 18, opacity: 0.8, marginTop: 6 }}>Makan Bergizi Gratis</div>
            </div>
            {compareMode ? (() => {
              const p1 = getPrimaryResult(totalMs);
              const p2 = getPrimaryResult(totalMs2);
              const pd = getPrimaryResult(diffMs);
              return (
                <div style={{
                  background: "white", borderRadius: 24, padding: isWide ? "32px 48px" : "40px 48px",
                  width: isWide ? "78%" : "88%",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center",
                }}>
                  <div style={{ display: "flex", gap: 20, justifyContent: "center", alignItems: "stretch" }}>
                    <div style={{ flex: 1, padding: "16px 8px", borderRadius: 16, background: "#f5f7fa" }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#003366" }}>Rp {inputFormatted || "0"}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#FF6600", marginTop: 8 }}>{p1.value}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#FF6600", opacity: 0.85 }}>{p1.unit} MBG</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", fontSize: 24, fontWeight: 800, color: "#888" }}>VS</div>
                    <div style={{ flex: 1, padding: "16px 8px", borderRadius: 16, background: "#f5f7fa" }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#003366" }}>Rp {inputFormatted2 || "0"}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#FF6600", marginTop: 8 }}>{p2.value}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#FF6600", opacity: 0.85 }}>{p2.unit} MBG</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: "2px dashed #e0e0e0" }}>
                    <div style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>SELISIH</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#003366", marginTop: 4 }}>Rp {formatRupiah(Math.round(diffRupiah))}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#FF6600", marginTop: 4 }}>= {pd.value} {pd.unit} MBG</div>
                  </div>
                </div>
              );
            })() : (
              <div style={{
                background: "white", borderRadius: 24, padding: isWide ? "36px 56px" : "48px 56px",
                width: isWide ? "70%" : "85%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center",
              }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#003366" }}>Rp {inputFormatted || "0"}</div>
                <div style={{ fontSize: 44, margin: "12px 0", color: "#888" }}>↓</div>
                {primary && (
                  <div style={{ fontSize: 40, fontWeight: 800, color: "#FF6600" }}>
                    {primary.value} {primary.unit} MBG
                  </div>
                )}
              </div>
            )}
            <div style={{ color: "white", textAlign: "center", marginTop: isWide ? 20 : 36, fontSize: 14 }}>
              <div style={{ opacity: 0.9 }}>Proyeksi biaya harian program MBG: Rp 1,2 Triliun/hari</div>
              <div style={{ opacity: 0.6, marginTop: 4, fontSize: 12 }}>Sumber: BGN (Badan Gizi Nasional)</div>
            </div>
            <div style={{ position: "absolute", bottom: 24, right: 40, color: "white", fontSize: 13, opacity: 0.7 }}>
              made by M. Alfin
            </div>
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", color: "white", fontSize: 11, opacity: 0.4 }}>
              mbgcal.lovable.app
            </div>
          </div>
        );
      })()}

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
