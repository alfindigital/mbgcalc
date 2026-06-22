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

function loadHistory(): HistoryEntry[] {
  try {
    const raw = getStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    // Migrate old entries without type
    return parsed.map((e) => ({ ...e, type: e.type || "single" }));
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const lastAddedRef = useRef<string>("");

  useEffect(() => {
    setStorage(STORAGE_KEY, JSON.stringify(history));
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

  return { history, addToHistory, clearHistory };
}
