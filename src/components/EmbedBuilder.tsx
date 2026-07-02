import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SITE_URL, EMBED_PATH } from "@/lib/site";
import { track } from "@/lib/analytics";
import { formatRupiah } from "@/lib/units";

type Theme = "auto" | "light" | "dark";

export function EmbedBuilder({ amount, compareAmount }: { amount: number; compareAmount: number }) {
  const [theme, setTheme] = useState<Theme>("auto");
  const [height, setHeight] = useState(560);
  const [minimal, setMinimal] = useState(false);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (amount > 0) p.set("amount", String(amount));
    if (compareAmount > 0) p.set("compare", String(compareAmount));
    if (theme !== "auto") p.set("theme", theme);
    if (minimal) p.set("minimal", "1");
    const qs = p.toString();
    return `${SITE_URL}${EMBED_PATH}${qs ? "?" + qs : ""}`;
  }, [amount, compareAmount, theme, minimal]);

  const snippet = `<iframe src="${url}" width="440" height="${height}" style="border:0;border-radius:16px;max-width:100%" loading="lazy" title="Kalkulator MBG"></iframe>`;

  return (
    <div className="space-y-3">
      {/* Kontrol */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1">
          <span className="font-semibold text-muted-foreground">Tema</span>
          <select
            value={theme} onChange={(e) => setTheme(e.target.value as Theme)}
            className="w-full h-9 px-2 rounded-lg border-2 border-border bg-card font-bold text-primary focus:outline-none focus:border-accent"
            aria-label="Tema embed"
          >
            <option value="auto">Ikuti pengunjung</option>
            <option value="light">Terang</option>
            <option value="dark">Gelap</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="font-semibold text-muted-foreground">Tinggi (px)</span>
          <input
            type="number" value={height} min={280} max={1200} step={20}
            onChange={(e) => setHeight(Math.max(280, Math.min(1200, parseInt(e.target.value) || 560)))}
            className="w-full h-9 px-2 rounded-lg border-2 border-border bg-card font-bold text-primary focus:outline-none focus:border-accent"
            aria-label="Tinggi embed"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold">
        <input type="checkbox" checked={minimal} onChange={(e) => setMinimal(e.target.checked)} />
        Mode read-only (sembunyikan input)
      </label>

      {/* Live preview */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Preview</p>
        <div className="rounded-lg overflow-hidden border-2 border-border bg-background">
          <iframe
            src={url} title="Preview embed Kalkulator MBG"
            width="100%" height={Math.min(height, 380)}
            style={{ border: 0, display: "block" }} loading="lazy"
          />
        </div>
        {(amount > 0 || compareAmount > 0) && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Angka: Rp {formatRupiah(amount)}{compareAmount > 0 ? ` vs Rp ${formatRupiah(compareAmount)}` : ""}
          </p>
        )}
      </div>

      {/* Snippet */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Snippet iframe</p>
        <pre className="text-[10px] sm:text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">{snippet}</pre>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(snippet);
          track("copy_embed", { theme, height, minimal });
          toast.success("Snippet disalin!");
        }}
        aria-label="Salin snippet iframe sematkan ke clipboard"
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-accent transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >Salin snippet</button>
    </div>
  );
}
