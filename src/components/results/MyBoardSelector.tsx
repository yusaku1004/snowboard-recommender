"use client";

import { useMemo, useState } from "react";
import { Board } from "@/types";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface MyBoardSelectorProps {
  boards: Board[];
  selectedBoard: Board | null;
  onSelect: (board: Board | null) => void;
}

export function MyBoardSelector({ boards, selectedBoard, onSelect }: MyBoardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const brands = useMemo(() => {
    const seen = new Set<string>();
    boards.forEach((b) => seen.add(b.brand));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [boards]);

  const filteredModels = useMemo(() => {
    let filtered = boards;
    if (brandFilter) {
      filtered = filtered.filter((b) => b.brand === brandFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.brand.toLowerCase().includes(q) ||
          b.model.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [boards, brandFilter, search]);

  const handleSelect = (board: Board) => {
    onSelect(board);
    setIsOpen(false);
    setBrandFilter(null);
    setSearch("");
  };

  const handleClear = () => {
    onSelect(null);
    setIsOpen(false);
    setBrandFilter(null);
    setSearch("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
          selectedBoard
            ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
            : "bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700/60"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {selectedBoard
          ? `${selectedBoard.brand} ${selectedBoard.model} と比較中`
          : "自分の板と比較"}
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="自分の板を選択"
      >
        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="ブランド名・モデル名で検索"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setBrandFilter(null);
            }}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 outline-none focus:border-sky-500/50"
          />
        </div>

        {/* Brand chips */}
        {!search && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setBrandFilter(null)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                !brandFilter
                  ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                  : "bg-slate-800/60 text-slate-500 border-slate-700/50"
              }`}
            >
              すべて
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setBrandFilter(brand === brandFilter ? null : brand)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                  brand === brandFilter
                    ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                    : "bg-slate-800/60 text-slate-500 border-slate-700/50"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        )}

        {/* Model list */}
        <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
          {filteredModels.map((board) => {
            const isSelected =
              selectedBoard?.brand === board.brand &&
              selectedBoard?.model === board.model &&
              selectedBoard?.year === board.year;
            return (
              <button
                key={`${board.brand}-${board.model}-${board.year}`}
                onClick={() => handleSelect(board)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-orange-500/10 text-orange-300 border border-orange-500/25"
                    : "bg-slate-800/40 text-slate-300 border border-transparent hover:bg-slate-700/40"
                }`}
              >
                <div className="text-left">
                  <span className="text-[10px] text-slate-500">{board.brand}</span>
                  <p className="font-medium text-sm">{board.model}</p>
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
          {filteredModels.length === 0 && (
            <p className="text-slate-500 text-center py-4 text-sm">該当するボードが見つかりません</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {selectedBoard && (
            <button
              onClick={handleClear}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium transition-all cursor-pointer text-sm border border-slate-700"
            >
              解除
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
