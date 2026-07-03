import { useState, useEffect, useCallback, useRef } from "react";
import { getStorage, setStorage } from "@/lib/storage";

export interface HistoryEntry {
  rupiah: number;
  rupiah2?: number;
  type: "single" | "compare";
  timestamp: number;
}

const STORAGE_KEY = "mbg-history";
const MAX_ENTRIES = 15;
const SCHEMA_VERSION = 1;

interface StoredShape {
  v: number;
  items: HistoryEntry[];
}

function isValidEntry(e: unknown): e is HistoryEntry {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return typeof x.rupiah === "number" && x.rupiah > 0 && typeof x.timestamp === "number";
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = getStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Format lama: array langsung → migrasi ke {v:1, items}.
    const items: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as StoredShape).items)
        ? (parsed as StoredShape).items
        : [];
    return items
      .filter(isValidEntry)
      .map((e) => ({ ...e, type: e.type === "compare" ? "compare" : "single" }))
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function persist(items: HistoryEntry[]) {
  setStorage(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, items }));
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const lastAddedRef = useRef<string>("");

  useEffect(() => {
    persist(history);
  }, [history]);

  const addToHistory = useCallback((rupiah: number, rupiah2?: number) => {
    if (rupiah <= 0) return;
    const type: "single" | "compare" = rupiah2 && rupiah2 > 0 ? "compare" : "single";
    const key = type === "compare" ? `${rupiah}-${rupiah2}` : `${rupiah}`;
    if (key === lastAddedRef.current) return;
    lastAddedRef.current = key;

    setHistory((prev) => {
      const filtered = prev.filter((e) => {
        if (type === "compare") return !(e.type === "compare" && e.rupiah === rupiah && e.rupiah2 === rupiah2);
        return !(e.type === "single" && e.rupiah === rupiah);
      });
      const entry: HistoryEntry = { rupiah, type, timestamp: Date.now(), ...(type === "compare" ? { rupiah2 } : {}) };
      return [entry, ...filtered].slice(0, MAX_ENTRIES);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    lastAddedRef.current = "";
  }, []);

  /** Ekspor riwayat sebagai file JSON download. */
  const exportHistory = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ v: SCHEMA_VERSION, exportedAt: new Date().toISOString(), items: history }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mbg-riwayat-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history]);

  /** Impor riwayat dari file JSON. Merge dengan yang ada, dedup, batasi MAX_ENTRIES. */
  const importHistory = useCallback(async (file: File): Promise<number> => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const raw: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray(parsed.items)
        ? parsed.items
        : [];
    const incoming = raw
      .filter(isValidEntry)
      .map((e) => ({ ...e, type: e.type === "compare" ? "compare" : "single" } as HistoryEntry));

    let added = 0;
    setHistory((prev) => {
      const seen = new Set(prev.map((e) => (e.type === "compare" ? `c:${e.rupiah}-${e.rupiah2}` : `s:${e.rupiah}`)));
      const merged = [...prev];
      for (const e of incoming) {
        const k = e.type === "compare" ? `c:${e.rupiah}-${e.rupiah2}` : `s:${e.rupiah}`;
        if (seen.has(k)) continue;
        seen.add(k);
        merged.push(e);
        added++;
      }
      merged.sort((a, b) => b.timestamp - a.timestamp);
      return merged.slice(0, MAX_ENTRIES);
    });
    return added;
  }, []);

  return { history, addToHistory, clearHistory, exportHistory, importHistory };
}
