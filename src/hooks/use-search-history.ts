import { useState, useEffect } from "react";

export interface SearchHistoryItem {
  element: string;
  phase: string;
  timestamp: number;
}

const STORAGE_KEY = "bimsmarter-search-history";
const MAX_HISTORY = 5;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load search history:", e);
    }
  }, []);

  // Save to localStorage
  const saveHistory = (newHistory: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (e) {
      console.error("Failed to save search history:", e);
    }
  };

  const addToHistory = (element: string, phase: string) => {
    if (!element || !phase) return;

    const newItem: SearchHistoryItem = {
      element,
      phase,
      timestamp: Date.now(),
    };

    // Remove duplicates and add new item at the start
    const filtered = history.filter(
      (item) => !(item.element === element && item.phase === phase)
    );
    const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY);
    saveHistory(newHistory);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  return {
    history,
    addToHistory,
    clearHistory,
  };
}
