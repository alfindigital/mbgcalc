import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { useSearchParams, Link } from "react-router-dom";
import { Sun, Moon, X, Copy, Download, Upload, ChevronDown, Trash2, Calculator, Info, Link2, History } from "lucide-react";
import {
  MBG_ANNUAL_BUDGET, MBG_ANNUAL_LABEL, MBG_DAILY_LABEL, MBG_BUDGET_YEAR, MBG_DATA_UPDATED,
} from "@/lib/mbg-constants";
import { Slider } from "@/components/ui/slider";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useHistory } from "@/hooks/useHistory";
import { getStorage, setStorage } from "@/lib/storage";
import {
  UNITS, SLIDER_MAX,
  rupiahToMs, msToRupiah, rupiahToPorsi, getPrimaryResult,
  formatRupiah, formatCompact, parseRupiahInput,
  sliderToRupiah, rupiahToSlider, niceRound,
} from "@/lib/units";
import { terbilang } from "@/lib/terbilang";
import { getAnalogy } from "@/lib/analogies";
import { PRESET_PAIRS } from "@/lib/presets";

import { track } from "@/lib/analytics";
import { SITE_URL } from "@/lib/site";


const SITE_HOST = new URL(SITE_URL).host;

const QUICK_AMOUNTS = [
  { label: "1 Jt", value: 1_000_000 },
  { label: "10 Jt", value: 10_000_000 },
  { label: "100 Jt", value: 100_000_000 },
];

/** Preset waktu utk mode Balik — pintasan yang paling sering dipakai. */
const REVERSE_QUICK = [
  { label: "1 hari", value: "1", unit: "hari" },
  { label: "1 minggu", value: "7", unit: "hari" },
  { label: "1 bulan", value: "1", unit: "bulan" },
  { label: "1 tahun", value: "1", unit: "tahun" },
];

const MODES = [
  { key: "hitung", label: "Hitung" },
  { key: "selisih", label: "Selisih" },
  { key: "balik", label: "Balik" },
] as const;
type ModeKey = (typeof MODES)[number]["key"];


// ─── Tema ───
function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return getStorage("mbg-theme") === "dark";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    setStorage("mbg-theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, useCallback(() => setDark((d) => !d), [])] as const;
}

// ─── Result Card ───
const ResultCard = React.memo(function ResultCard({
  rupiah, totalMs, compact,
}: {
  rupiah: number; totalMs: number; compact?: boolean;
}) {
  const animatedMs = useAnimatedNumber(totalMs, 400);
  const primary = getPrimaryResult(animatedMs);
  const porsi = rupiah > 0 ? rupiahToPorsi(rupiah) : 0;

  return (
    <div className={`relative card-elevated rounded-2xl border-2 border-border animate-fade-in-up ${compact ? "p-3 sm:p-4" : "p-4 sm:p-6 result-glow"}`}>
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className={`${compact ? "text-xl sm:text-2xl" : "text-4xl sm:text-5xl"} font-extrabold text-result-glow tabular-nums tracking-tight`}>
            {primary.value}
          </span>
          <span className={`${compact ? "text-xs sm:text-sm" : "text-base sm:text-xl"} font-bold text-result opacity-80`}>
            {primary.unit}
          </span>
        </div>
        <span className={`${compact ? "text-[10px]" : "text-xs sm:text-sm"} font-semibold text-muted-foreground`}>operasional program MBG</span>
      </div>

      {rupiah > 0 && (
        <div className={`text-center ${compact ? "mt-1.5" : "mt-3 pt-3 border-t border-border"}`}>
          <span className={`${compact ? "text-[11px] sm:text-xs" : "text-base sm:text-lg"} font-extrabold text-result`}>≈ {formatCompact(porsi)}</span>
          <span className={`${compact ? "text-[9px] sm:text-[10px]" : "text-xs sm:text-sm"} font-semibold text-muted-foreground`}> porsi makan gratis</span>
        </div>
      )}

      {!compact && rupiah >= 1_000_000_000 && rupiah <= Number.MAX_SAFE_INTEGER && (
        <p className="text-[11px] text-muted-foreground italic capitalize mt-2 text-center leading-snug">
          {terbilang(rupiah)} rupiah
        </p>
      )}

      {!compact && rupiah > 0 && getAnalogy(rupiah) && (
        <p className="mt-3 pt-3 border-t border-border text-center text-xs sm:text-sm font-semibold text-accent leading-snug">
          {getAnalogy(rupiah)}
        </p>
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
  const [reverseMode, setReverseMode] = useState(false);
  const [reverseValue, setReverseValue] = useState("");
  const [reverseUnit, setReverseUnit] = useState("detik");
  const [saving, setSaving] = useState(false);
  const [saveRatio, setSaveRatio] = useState<"1:1" | "9:16" | "16:9">("1:1");
  
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const modeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [compareMode, setCompareMode] = useState(() => !!searchParams.get("compare"));
  const [rawInput2, setRawInput2] = useState(() => {
    const a = parseInt(searchParams.get("compare") || "0", 10);
    return a > 0 ? formatRupiah(a) : "";
  });
  const [activeQuick2, setActiveQuick2] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingClear, setPendingClear] = useState(false);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { history, addToHistory, clearHistory, exportHistory, importHistory } = useHistory();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const added = await importHistory(file);
      toast.success(added > 0 ? `${added} entri riwayat diimpor` : "Tidak ada entri baru");
    } catch {
      toast.error("File tidak valid");
    }
  }, [importHistory]);

  const handleClearClick = useCallback(() => {
    if (pendingClear) {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      clearHistory();
      setPendingClear(false);
      toast.success("Riwayat dihapus");
    } else {
      setPendingClear(true);
      clearTimeoutRef.current = setTimeout(() => setPendingClear(false), 3000);
    }
  }, [pendingClear, clearHistory]);

  useEffect(() => { if (!rawInput) inputRef.current?.focus(); }, []);

  const rupiah = useMemo(() => parseRupiahInput(rawInput), [rawInput]);
  const debouncedRupiah = rupiah;
  const totalMs = useMemo(() => rupiahToMs(debouncedRupiah), [debouncedRupiah]);
  const inputFormatted = useMemo(() => (rupiah > 0 ? formatRupiah(rupiah) : ""), [rupiah]);

  const rupiah2 = useMemo(() => parseRupiahInput(rawInput2), [rawInput2]);
  const debouncedRupiah2 = rupiah2;
  const totalMs2 = useMemo(() => rupiahToMs(debouncedRupiah2), [debouncedRupiah2]);
  const inputFormatted2 = useMemo(() => (rupiah2 > 0 ? formatRupiah(rupiah2) : ""), [rupiah2]);

  const currentMode: ModeKey = reverseMode ? "balik" : compareMode ? "selisih" : "hitung";

  const setMode = useCallback((m: ModeKey) => {
    setCompareMode(m === "selisih");
    setReverseMode(m === "balik");
    track("mode_switch", { mode: m });
  }, []);

  const onModeKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = MODES.findIndex((m) => m.key === currentMode);
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % MODES.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + MODES.length) % MODES.length;
    else return;
    e.preventDefault();
    setMode(MODES[next].key);
    modeRefs.current[next]?.focus();
  }, [currentMode, setMode]);

  // History + analytics on new result
  const prevDebouncedRef = useRef("");
  useEffect(() => {
    const key = compareMode
      ? (debouncedRupiah > 0 && debouncedRupiah2 > 0 ? `${debouncedRupiah}-${debouncedRupiah2}` : "")
      : (debouncedRupiah > 0 ? `${debouncedRupiah}` : "");
    if (key && key !== prevDebouncedRef.current) {
      prevDebouncedRef.current = key;
      if (compareMode) addToHistory(debouncedRupiah, debouncedRupiah2);
      else addToHistory(debouncedRupiah);
      track("calculate", { mode: currentMode });
    }
  }, [debouncedRupiah, debouncedRupiah2, compareMode, addToHistory, currentMode]);

  // Konfeti milestone (1T / 100T / anggaran tahunan)
  const firedMilestones = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (debouncedRupiah === 0) { firedMilestones.current.clear(); return; }
    const thresholds = [1e12, 100e12, MBG_ANNUAL_BUDGET];
    for (const t of thresholds) {
      if (debouncedRupiah >= t && !firedMilestones.current.has(t)) {
        firedMilestones.current.add(t);
        const intensity = t === MBG_ANNUAL_BUDGET ? 200 : t === 100e12 ? 130 : 80;
        import("canvas-confetti").then(({ default: confetti }) => {
          confetti({
            particleCount: intensity, spread: 75, origin: { y: 0.35 },
            colors: ["#003366", "#FF6600", "#FFD700", "#0066CC"],
          });
        });
        if (t === MBG_ANNUAL_BUDGET) toast.success(`🎉 Anggaran MBG ${MBG_BUDGET_YEAR} terpenuhi (${MBG_ANNUAL_LABEL})!`);
        else if (t === 100e12) toast.success("🎊 Rp 100 Triliun!");
        else toast.success("🎈 Rp 1 Triliun!");
      }
    }
  }, [debouncedRupiah]);

  useEffect(() => {
    return () => { if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current); };
  }, []);

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
      setReverseMode(false);
      setRawInput(formatRupiah(val));
      setRawInput2(formatRupiah(val2));
      setActiveQuick(null);
      setActiveQuick2(null);
    } else {
      setCompareMode(false);
      setReverseMode(false);
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

  const buildShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedRupiah > 0) params.set("amount", String(debouncedRupiah));
    if (compareMode && debouncedRupiah2 > 0) params.set("compare", String(debouncedRupiah2));
    return `${SITE_URL}/${params.toString() ? "?" + params.toString() : ""}`;
  }, [debouncedRupiah, debouncedRupiah2, compareMode]);

  const handleSaveImage = useCallback(async (ratio: "1:1" | "9:16" | "16:9" = "1:1") => {
    if (saving) return;
    setSaveRatio(ratio);
    setSaving(true);
    // Tunggu node capture ter-render dengan dimensi baru
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      if (!captureRef.current) throw new Error("capture node belum siap");
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
      if (compareMode && debouncedRupiah > 0 && debouncedRupiah2 > 0) addToHistory(debouncedRupiah, debouncedRupiah2);
      else if (debouncedRupiah > 0) addToHistory(debouncedRupiah);
      track("save_png", { ratio, mode: currentMode });
      toast.success("Gambar berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh gambar");
    } finally { setSaving(false); }
  }, [saving, debouncedRupiah, debouncedRupiah2, compareMode, addToHistory, currentMode]);

  const handleCopyLink = useCallback(() => {
    const url = buildShareUrl();
    navigator.clipboard.writeText(url);
    track("copy_link", { mode: currentMode });
    toast.success("Tautan disalin!");
  }, [buildShareUrl, currentMode]);



  const handleCopyText = useCallback(() => {
    const p = getPrimaryResult(totalMs);
    navigator.clipboard.writeText(
      `Rp ${inputFormatted} = ${p.value} ${p.unit} program MBG (≈ ${formatCompact(rupiahToPorsi(debouncedRupiah))} porsi makan gratis)`
    );
    track("copy_text", { mode: "hitung" });
    toast.success("Teks berhasil disalin!");
    if (debouncedRupiah > 0) addToHistory(debouncedRupiah);
  }, [totalMs, inputFormatted, debouncedRupiah, addToHistory]);

  const handleCopyCompare = useCallback(() => {
    const p1 = getPrimaryResult(totalMs);
    const p2 = getPrimaryResult(totalMs2);
    const pd = getPrimaryResult(diffMs);
    const txt =
      `Bandingkan biaya MBG:\n` +
      `• Rp ${formatRupiah(debouncedRupiah)} = ${p1.value} ${p1.unit}\n` +
      `• Rp ${formatRupiah(debouncedRupiah2)} = ${p2.value} ${p2.unit}\n` +
      `Selisih: Rp ${formatRupiah(Math.round(diffRupiah))} = ${pd.value} ${pd.unit} program MBG`;
    navigator.clipboard.writeText(txt);
    track("copy_text", { mode: "selisih" });
    toast.success("Teks berhasil disalin!");
    if (debouncedRupiah > 0 && debouncedRupiah2 > 0) addToHistory(debouncedRupiah, debouncedRupiah2);
  }, [debouncedRupiah, debouncedRupiah2, totalMs, totalMs2, diffMs, diffRupiah, addToHistory]);

  const primary = useMemo(() => (debouncedRupiah > 0 ? getPrimaryResult(totalMs) : null), [debouncedRupiah, totalMs]);

  // Ringkasan untuk screen reader (pakai nilai final, bukan animasi → tidak spam)
  const liveSummary = useMemo(() => {
    if (reverseMode) {
      return reverseRupiah > 0 ? `Setara dengan Rp ${formatRupiah(Math.round(reverseRupiah))}.` : "";
    }
    if (compareMode) {
      if (!(debouncedRupiah > 0 && debouncedRupiah2 > 0)) return "";
      const p1 = getPrimaryResult(totalMs); const p2 = getPrimaryResult(totalMs2); const pd = getPrimaryResult(diffMs);
      return `Rp ${formatRupiah(debouncedRupiah)} setara ${p1.value} ${p1.unit}. Rp ${formatRupiah(debouncedRupiah2)} setara ${p2.value} ${p2.unit}. Selisih ${pd.value} ${pd.unit} program MBG.`;
    }
    if (debouncedRupiah > 0 && primary) {
      return `Rp ${formatRupiah(debouncedRupiah)} setara dengan ${primary.value} ${primary.unit} operasional program MBG, atau sekitar ${formatCompact(rupiahToPorsi(debouncedRupiah))} porsi makan gratis.`;
    }
    return "";
  }, [reverseMode, compareMode, reverseRupiah, debouncedRupiah, debouncedRupiah2, totalMs, totalMs2, diffMs, primary]);

  const modeTransition = "transition-all duration-300 ease-out will-change-[opacity,transform]";
  const bothCompare = debouncedRupiah > 0 && debouncedRupiah2 > 0;

  // Meta dinamis per-URL untuk crawler yang menjalankan JS (Googlebot, Bingbot).
  // Social crawler (WhatsApp/FB/LinkedIn) tetap membaca fallback statis di index.html.
  const dynamicMeta = useMemo(() => {
    if (reverseMode || compareMode || debouncedRupiah <= 0) return null;
    const p = getPrimaryResult(totalMs);
    const porsi = rupiahToPorsi(debouncedRupiah);
    const rpLabel = formatCompact(debouncedRupiah);
    return {
      title: `Rp ${rpLabel} = ${p.value} ${p.unit} program MBG · Kalkulator MBG`,
      description: `Rp ${formatRupiah(debouncedRupiah)} setara dengan ${p.value} ${p.unit} biaya operasional program Makan Bergizi Gratis (MBG), atau sekitar ${formatCompact(porsi)} porsi makan gratis.`,
      url: `${SITE_URL}/?amount=${debouncedRupiah}`,
    };
  }, [reverseMode, compareMode, debouncedRupiah, totalMs]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      <Helmet>
        <link rel="canonical" href={dynamicMeta ? dynamicMeta.url : `${SITE_URL}/`} />
        {dynamicMeta && <title>{dynamicMeta.title}</title>}
        {dynamicMeta && <meta name="description" content={dynamicMeta.description} />}
        {dynamicMeta && <meta property="og:title" content={dynamicMeta.title} />}
        {dynamicMeta && <meta property="og:description" content={dynamicMeta.description} />}
        <meta property="og:url" content={dynamicMeta ? dynamicMeta.url : `${SITE_URL}/`} />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/60" style={{ background: "hsl(var(--header-bg))", backdropFilter: "blur(12px)" }}>
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
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
                type="button"
                className="p-2 sm:p-2.5 rounded-xl border-2 border-border bg-card hover:bg-muted transition-colors active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Buka riwayat (${history.length})`}
              >
                <History size={17} className="text-muted-foreground" aria-hidden="true" />
              </button>
            )}
            <button
              onClick={toggleDark}
              type="button"
              className="p-2 sm:p-2.5 rounded-xl border-2 border-border bg-card hover:bg-muted transition-colors active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              aria-pressed={dark}
              title={dark ? "Mode terang" : "Mode gelap"}
            >
              {dark ? <Sun size={17} className="text-amber-400" aria-hidden="true" /> : <Moon size={17} className="text-muted-foreground" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-5 py-6 sm:py-8 flex-1 flex flex-col">
        {/* Hero */}
        <section className="text-center mb-5 sm:mb-7 max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-[1.75rem] font-extrabold text-foreground tracking-tight text-balance leading-tight">
            Berapa lama uang segini bisa menjalankan program <span className="text-primary">Makan Bergizi Gratis</span>?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Ketik nominal apa pun — lihat setaranya dalam waktu program MBG dan jumlah porsi makan gratis.
          </p>
        </section>

        {/* Live region untuk screen reader */}
        <p className="sr-only" role="status" aria-live="polite">{liveSummary}</p>

        {/* Mode Toggle */}
        <div className="flex items-center justify-center mb-4 sm:mb-5">
          <div role="radiogroup" aria-label="Mode kalkulator" onKeyDown={onModeKeyDown}
               className="inline-flex rounded-xl border-2 border-primary/15 bg-muted/50 p-0.5 sm:p-1 text-sm shadow-sm">
            {MODES.map((m, i) => {
              const active = currentMode === m.key;
              return (
                <button
                  key={m.key}
                  ref={(el) => (modeRefs.current[i] = el)}
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setMode(m.key)}
                  className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calculator: single column */}
        <div className="max-w-md mx-auto w-full">
          {/* ── input ── */}
          <div>
            <div className="relative">
              {/* Normal mode input */}
              <div className={`${modeTransition} ${!compareMode && !reverseMode ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none absolute inset-0"}`}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative flex items-center group">
                    <span className="absolute left-3.5 sm:left-4 text-muted-foreground font-bold text-sm sm:text-base select-none pointer-events-none transition-colors group-focus-within:text-primary">Rp</span>
                    <input
                      ref={!compareMode ? inputRef : undefined}
                      type="text" inputMode="numeric" value={rawInput} onChange={handleInput} onPaste={handlePaste}
                      placeholder="Ketik jumlah..." aria-label="Jumlah Rupiah"
                      className="w-full h-12 sm:h-14 pl-10 sm:pl-11 pr-10 sm:pr-11 rounded-2xl border-2 border-border bg-card text-base sm:text-lg font-bold focus:outline-none focus:border-accent input-glow transition-colors placeholder:text-muted-foreground placeholder:font-normal"
                      tabIndex={compareMode ? -1 : 0}
                    />
                    {rawInput && (
                      <button onClick={handleClear} className="absolute right-2 sm:right-2.5 p-2 rounded-xl hover:bg-muted transition-colors active:scale-90" aria-label="Hapus" tabIndex={compareMode ? -1 : 0}>
                        <X size={15} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div>
                    <Slider
                      value={[rupiahToSlider(rupiah)]}
                      onValueChange={([pos]) => { setActiveQuick(null); const val = sliderToRupiah(pos); setRawInput(val > 0 ? formatRupiah(val) : ""); }}
                      onValueCommit={([pos]) => { const val = niceRound(sliderToRupiah(pos)); setRawInput(val > 0 ? formatRupiah(val) : ""); }}
                      max={SLIDER_MAX} step={0.5}
                      thumbProps={{ "aria-label": "Geser nominal Rupiah", "aria-valuetext": rupiah > 0 ? `Rp ${formatRupiah(rupiah)}` : "Rp 0" }}
                      className="w-full touch-pan-y"
                    />
                    <div className="relative mt-1.5 h-3 text-[10px] sm:text-[11px] text-muted-foreground font-medium select-none">
                      <span className="absolute left-0">Rp 0</span>
                      <span className="absolute left-1/2 -translate-x-1/2">1 Jt</span>
                      <span className="absolute left-[75%] -translate-x-1/2">1 M</span>
                      <span className="absolute right-0">1 T</span>
                    </div>
                  </div>
                  <QuickButtons amounts={QUICK_AMOUNTS} active={activeQuick} onSelect={handleQuick} disabled={compareMode} />

                </div>

              </div>

              {/* Compare mode input */}
              <div className={`${modeTransition} ${compareMode ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none absolute inset-0"}`}>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="relative flex items-center">
                      <span className="absolute left-2 sm:left-2.5 text-muted-foreground font-bold text-[11px] sm:text-xs select-none pointer-events-none">Rp</span>
                      <input
                        ref={compareMode ? inputRef : undefined}
                        type="text" inputMode="numeric" value={rawInput} onChange={handleInput} onPaste={handlePaste}
                        placeholder="Jumlah 1" aria-label="Jumlah Rupiah pertama"
                        className="w-full h-10 sm:h-11 pl-7 sm:pl-8 pr-6 sm:pr-7 rounded-xl border-2 border-border bg-card text-xs sm:text-sm font-bold focus:outline-none focus:border-accent input-glow transition-colors"
                        tabIndex={!compareMode ? -1 : 0}
                      />
                      {rawInput && (
                        <button onClick={handleClear} className="absolute right-1 sm:right-1.5 p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Hapus" tabIndex={!compareMode ? -1 : 0}>
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
                        placeholder="Jumlah 2" aria-label="Jumlah Rupiah kedua"
                        className="w-full h-10 sm:h-11 pl-7 sm:pl-8 pr-6 sm:pr-7 rounded-xl border-2 border-border bg-card text-xs sm:text-sm font-bold focus:outline-none focus:border-accent input-glow transition-colors"
                        tabIndex={!compareMode ? -1 : 0}
                      />
                      {rawInput2 && (
                        <button onClick={handleClear2} className="absolute right-1 sm:right-1.5 p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Hapus" tabIndex={!compareMode ? -1 : 0}>
                          <X size={13} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <QuickButtons amounts={QUICK_AMOUNTS} active={activeQuick2} onSelect={handleQuick2} compact disabled={!compareMode} />
                  </div>
                </div>

              </div>
            </div>

            {/* Reverse mode input */}
            <div className={`${modeTransition} ${reverseMode ? "opacity-100 translate-y-0 max-h-64" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`} aria-hidden={!reverseMode}>
              <div className="flex gap-2">
                <div className="relative flex-1 flex items-center group">
                  <input
                    type="text" inputMode="decimal" value={reverseValue}
                    onChange={(e) => setReverseValue(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="Ketik jumlah..." aria-label="Jumlah waktu" tabIndex={reverseMode ? 0 : -1}
                    className="w-full h-12 sm:h-14 px-3.5 sm:px-4 rounded-2xl border-2 border-border bg-card text-base sm:text-lg font-bold focus:outline-none focus:border-accent input-glow transition-colors placeholder:text-muted-foreground placeholder:font-normal"
                  />
                </div>
                <select
                  value={reverseUnit} onChange={(e) => setReverseUnit(e.target.value)}
                  aria-label="Satuan waktu" tabIndex={reverseMode ? 0 : -1}
                  className="h-12 sm:h-14 px-3 sm:px-4 rounded-2xl border-2 border-border bg-card text-sm sm:text-base font-bold text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  {UNITS.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
                </select>
              </div>
              {/* Quick chips utk mode Balik */}
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {REVERSE_QUICK.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => { setReverseValue(q.value); setReverseUnit(q.unit); track("reverse_quick", { label: q.label }); }}
                    tabIndex={reverseMode ? 0 : -1}
                    className="h-8 px-3 rounded-lg border border-primary/25 bg-card text-[11px] font-bold text-primary hover:bg-primary/5 active:scale-[0.96] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── hasil ── */}
          <div className="mt-4">
            {/* Result — Normal */}
            <div className={`${modeTransition} ${!compareMode && !reverseMode ? "opacity-100 translate-y-0 max-h-[600px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}>
              <div className="space-y-2.5 sm:space-y-3">
                <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} />
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={handleCopyText} aria-label="Salin teks hasil ke clipboard"
                    className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <Copy size={13} aria-hidden="true" /> Teks
                  </button>
                  <button onClick={handleCopyLink} aria-label="Salin tautan hasil ke clipboard"
                    className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <Link2 size={13} aria-hidden="true" /> Link
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button disabled={saving} aria-label="Simpan hasil sebagai gambar, pilih rasio"
                        className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                        <Download size={13} aria-hidden="true" /> {saving ? "..." : "PNG"} <ChevronDown size={11} className="opacity-70" aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44" loop>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("1:1"); }} aria-label="Simpan gambar rasio 1:1 untuk Instagram Feed" className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                        <div className="flex flex-col"><span className="font-semibold text-xs">1:1 — IG Feed</span><span className="text-[10px] text-muted-foreground">1080 × 1080</span></div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("9:16"); }} aria-label="Simpan gambar rasio 9:16 untuk Story atau Reels" className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                        <div className="flex flex-col"><span className="font-semibold text-xs">9:16 — Story / Reels</span><span className="text-[10px] text-muted-foreground">1080 × 1920</span></div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSaveImage("16:9"); }} aria-label="Simpan gambar rasio 16:9 untuk Twitter atau Web" className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                        <div className="flex flex-col"><span className="font-semibold text-xs">16:9 — Twitter / Web</span><span className="text-[10px] text-muted-foreground">1920 × 1080</span></div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Result — Compare */}
            <div className={`${modeTransition} ${compareMode ? "opacity-100 translate-y-0 max-h-[600px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <ResultCard rupiah={debouncedRupiah} totalMs={totalMs} compact />
                  <ResultCard rupiah={debouncedRupiah2} totalMs={totalMs2} compact />
                </div>
                <Section>
                  <p className="text-[11px] text-muted-foreground mb-0.5 text-center font-medium">Selisih</p>
                  <p className="text-xs sm:text-sm font-extrabold text-center">Rp {formatRupiah(Math.round(diffRupiah))}</p>
                  <p className="text-xs sm:text-sm font-bold text-result text-center">= {getPrimaryResult(diffMs).value} {getPrimaryResult(diffMs).unit} program MBG</p>
                </Section>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={handleCopyCompare} aria-label="Salin teks perbandingan ke clipboard" disabled={!bothCompare}
                    className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50">
                    <Copy size={13} aria-hidden="true" /> Teks
                  </button>
                  <button onClick={handleCopyLink} aria-label="Salin tautan perbandingan ke clipboard" disabled={!bothCompare}
                    className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50">
                    <Link2 size={13} aria-hidden="true" /> Link
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button disabled={saving || !bothCompare} aria-label="Simpan perbandingan sebagai gambar, pilih rasio"
                        className="h-10 sm:h-11 rounded-xl border-2 border-primary/20 text-primary font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                        <Download size={13} aria-hidden="true" /> {saving ? "..." : "PNG"} <ChevronDown size={11} className="opacity-70" aria-hidden="true" />
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

            {/* Result — Reverse */}
            <div className={`${modeTransition} ${reverseMode ? "opacity-100 translate-y-0 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`} aria-hidden={!reverseMode}>
              <div className="space-y-3 sm:space-y-4">
                <div className="relative card-elevated rounded-2xl border-2 border-border p-4 sm:p-6 result-glow animate-fade-in-up">
                  <div className="text-center">
                    <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Setara dengan</p>
                    <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-result/80">Rp</span>
                      <span className="text-3xl sm:text-4xl font-extrabold text-result-glow tabular-nums tracking-tight">{formatRupiah(Math.round(reverseRupiah))}</span>
                    </div>
                    {reverseRupiah > 0 && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground italic capitalize mt-2 leading-snug">{terbilang(Math.round(reverseRupiah))} rupiah</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (reverseRupiah <= 0) return;
                    const unitLabel = UNITS.find((u) => u.key === reverseUnit)?.label.toLowerCase() ?? "";
                    navigator.clipboard.writeText(`${reverseValue} ${unitLabel} MBG = Rp ${formatRupiah(Math.round(reverseRupiah))}`);
                    track("copy_text", { mode: "balik" });
                    toast.success("Teks berhasil disalin!");
                  }}
                  disabled={reverseRupiah <= 0} aria-label="Salin hasil ke clipboard"
                  className="w-full h-10 sm:h-11 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 hover:bg-accent shadow-md shadow-primary/15 active:scale-[0.97] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Copy size={13} aria-hidden="true" /> Salin Teks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Konten edukasi panjang dipindah ke /tentang demi tampilan utama yang clean. */}


        {/* History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="leading-none">Riwayat</DialogTitle>
              <DialogDescription className="sr-only">Daftar perhitungan terakhir Anda</DialogDescription>
            </DialogHeader>
            {history.length > 0 && (
              <button onClick={handleClearClick}
                aria-label={pendingClear ? "Klik lagi untuk menghapus semua riwayat" : "Hapus semua riwayat"}
                className={`absolute right-11 top-4 inline-flex items-center justify-center rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${pendingClear ? "text-destructive" : "text-muted-foreground hover:text-destructive opacity-70 hover:opacity-100"}`}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {pendingClear && <span className="sr-only">Klik lagi untuk konfirmasi</span>}
              </button>
            )}
            {history.length > 0 ? (
              <HistoryList history={history} onTap={(v, v2, t) => { handleHistoryTap(v, v2, t); setHistoryOpen(false); }} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada riwayat</p>
            )}
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleImportFile}
              aria-hidden="true"
              tabIndex={-1}
            />
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="flex-1 h-9 rounded-lg border-2 border-border bg-card hover:bg-muted text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Impor riwayat dari file JSON"
              >
                <Upload size={13} aria-hidden="true" /> Impor
              </button>
              <button
                type="button"
                onClick={() => { exportHistory(); toast.success("Riwayat diekspor"); }}
                disabled={history.length === 0}
                className="flex-1 h-9 rounded-lg border-2 border-border bg-card hover:bg-muted text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Ekspor riwayat sebagai file JSON"
              >
                <Download size={13} aria-hidden="true" /> Ekspor
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-primary/15 py-3 px-4" style={{ background: "hsl(var(--footer-bg))" }}>
        <div className="flex items-center justify-center gap-2 flex-wrap text-[10px] sm:text-[11px] text-muted-foreground font-medium">
          <span>made by <span className="font-bold text-primary">M. Alfin</span></span>
          <span className="text-muted-foreground">·</span>
          <span title="Tanggal data anggaran MBG terakhir diperbarui">Data {MBG_DATA_UPDATED}</span>
          <span className="text-muted-foreground">·</span>
          <Link
            to="/tentang"
            aria-label="Halaman tentang: metodologi, FAQ, dan sumber data"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors font-semibold underline underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Info size={11} aria-hidden="true" /> Tentang
          </Link>
        </div>
      </footer>

      {/* Off-screen capture (hanya render saat menyimpan) */}
      {saving && (() => {
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
              const p1 = getPrimaryResult(totalMs); const p2 = getPrimaryResult(totalMs2); const pd = getPrimaryResult(diffMs);
              return (
                <div style={{ background: "white", borderRadius: 24, padding: isWide ? "32px 48px" : "40px 48px", width: isWide ? "78%" : "88%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
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
              <div style={{ background: "white", borderRadius: 24, padding: isWide ? "36px 56px" : "48px 56px", width: isWide ? "70%" : "85%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#003366" }}>Rp {inputFormatted || "0"}</div>
                <div style={{ fontSize: 44, margin: "12px 0", color: "#888" }}>↓</div>
                {primary && (
                  <>
                    <div style={{ fontSize: 40, fontWeight: 800, color: "#FF6600" }}>{primary.value} {primary.unit} MBG</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#003366", marginTop: 10 }}>≈ {formatCompact(rupiahToPorsi(debouncedRupiah))} porsi makan gratis</div>
                  </>
                )}
              </div>
            )}
            <div style={{ color: "white", textAlign: "center", marginTop: isWide ? 20 : 36, fontSize: 14 }}>
              <div style={{ opacity: 0.9 }}>Anggaran MBG {MBG_BUDGET_YEAR}: {MBG_ANNUAL_LABEL} (≈ {MBG_DAILY_LABEL}/hari)</div>
              <div style={{ opacity: 0.6, marginTop: 4, fontSize: 12 }}>Sumber: APBN {MBG_BUDGET_YEAR} · BGN</div>
            </div>
            <div style={{ position: "absolute", bottom: 24, right: 40, color: "white", fontSize: 13, opacity: 0.7 }}>made by M. Alfin</div>
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", color: "white", fontSize: 11, opacity: 0.4 }}>{SITE_HOST}</div>
          </div>
        );
      })()}

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 250ms ease-out; }
      `}</style>
    </div>
  );
}
