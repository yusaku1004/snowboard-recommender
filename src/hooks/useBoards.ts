"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Board } from "@/types";

// ボードデータ（/boards.json）を1回だけ取得して共有するストア
let boards: Board[] | null = null;
let failed = false;
let loading = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadBoards() {
  if (boards || loading) return;
  loading = true;
  failed = false;
  notify();
  fetch("/boards.json")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Board[]>;
    })
    .then((data) => {
      boards = data;
    })
    .catch(() => {
      failed = true;
    })
    .finally(() => {
      loading = false;
      notify();
    });
}

export function useBoards(): { boards: Board[] | null; failed: boolean; retry: () => void } {
  const data = useSyncExternalStore(subscribe, () => boards, () => null);
  const isFailed = useSyncExternalStore(subscribe, () => failed, () => false);

  useEffect(() => {
    loadBoards();
  }, []);

  return { boards: data, failed: isFailed, retry: loadBoards };
}
