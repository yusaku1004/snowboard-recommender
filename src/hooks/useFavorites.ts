"use client";

import { useState, useEffect, useCallback } from "react";
import { Board } from "@/types";

const STORAGE_KEY = "snowboard_favorites_v1";

function boardKey(board: Board): string {
  return `${board.brand}__${board.model}__${board.year}`;
}

export function useFavorites() {
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavoriteKeys(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  const persist = useCallback((keys: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(keys)));
    } catch {}
  }, []);

  const toggleFavorite = useCallback((board: Board) => {
    const key = boardKey(board);
    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      persist(next);
      return next;
    });
  }, [persist]);

  const isFavorite = useCallback((board: Board) => {
    return favoriteKeys.has(boardKey(board));
  }, [favoriteKeys]);

  return { favoriteKeys, isFavorite, toggleFavorite, count: favoriteKeys.size };
}
