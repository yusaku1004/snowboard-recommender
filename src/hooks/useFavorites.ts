"use client";

import { useCallback, useMemo } from "react";
import { Board } from "@/types";
import { readLocalStorage, useLocalStorageItem, writeLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "snowboard_favorites_v1";

function boardKey(board: Board): string {
  return `${board.brand}__${board.model}__${board.year}`;
}

function parseKeys(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function useFavorites() {
  const raw = useLocalStorageItem(STORAGE_KEY);
  const favoriteKeys = useMemo(() => parseKeys(raw), [raw]);

  const toggleFavorite = useCallback((board: Board) => {
    const key = boardKey(board);
    const next = parseKeys(readLocalStorage(STORAGE_KEY));
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    writeLocalStorage(STORAGE_KEY, JSON.stringify(Array.from(next)));
  }, []);

  const isFavorite = useCallback((board: Board) => {
    return favoriteKeys.has(boardKey(board));
  }, [favoriteKeys]);

  return { favoriteKeys, isFavorite, toggleFavorite, count: favoriteKeys.size };
}
