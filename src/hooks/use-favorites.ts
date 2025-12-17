import { useState, useEffect } from "react";

export interface FavoriteItem {
  element: string;
  phase: string;
  label?: string;
}

const STORAGE_KEY = "bimsmarter-favorites";
const MAX_FAVORITES = 10;

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load favorites:", e);
    }
  }, []);

  // Save to localStorage
  const saveFavorites = (newFavorites: FavoriteItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (e) {
      console.error("Failed to save favorites:", e);
    }
  };

  const addFavorite = (element: string, phase: string, label?: string) => {
    if (!element || !phase) return false;

    // Check if already exists
    const exists = favorites.some(
      (fav) => fav.element === element && fav.phase === phase
    );
    if (exists) return false;

    if (favorites.length >= MAX_FAVORITES) return false;

    const newFavorite: FavoriteItem = {
      element,
      phase,
      label: label || `${element} - ${phase}`,
    };

    saveFavorites([...favorites, newFavorite]);
    return true;
  };

  const removeFavorite = (element: string, phase: string) => {
    const newFavorites = favorites.filter(
      (fav) => !(fav.element === element && fav.phase === phase)
    );
    saveFavorites(newFavorites);
  };

  const isFavorite = (element: string, phase: string) => {
    return favorites.some(
      (fav) => fav.element === element && fav.phase === phase
    );
  };

  const toggleFavorite = (element: string, phase: string) => {
    if (isFavorite(element, phase)) {
      removeFavorite(element, phase);
      return false;
    } else {
      return addFavorite(element, phase);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
