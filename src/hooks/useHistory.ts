import { useState, useEffect, useCallback, useRef } from "react";

export interface HistoryEntry {
  rupiah: number;
  timestamp: number;
}

const STORAGE_KEY = "mbg-history";
const MAX_ENTRIES = 10;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const lastAddedRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = useCallback((rupiah: number) => {
    if (rupiah <= 0 || rupiah === lastAddedRef.current) return;
    lastAddedRef.current = rupiah;
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.rupiah !== rupiah);
      const entry: HistoryEntry = { rupiah, timestamp: Date.now() };
      return [entry, ...filtered].slice(0, MAX_ENTRIES);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    lastAddedRef.current = 0;
  }, []);

  return { history, addToHistory, clearHistory };
}
