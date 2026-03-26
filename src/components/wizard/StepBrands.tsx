"use client";

import { useMemo } from "react";
import { Board } from "@/types";
import { Button } from "@/components/ui/Button";
import boardsData from "@/data/boards_data.json";

interface StepBrandsProps {
  selectedBrands: Set<string> | null;
  onBrandsChange: (brands: Set<string> | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepBrands({
  selectedBrands,
  onBrandsChange,
  onNext,
  onBack,
}: StepBrandsProps) {
  const allBoards = boardsData as Board[];

  const brands = useMemo(() => {
    const seen = new Set<string>();
    allBoards.forEach((b) => seen.add(b.brand));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allBoards]);

  const allSelected = selectedBrands === null;

  const toggleBrand = (brand: string) => {
    const next = new Set(selectedBrands ?? brands);
    if (next.has(brand)) {
      next.delete(brand);
      if (next.size === 0) {
        onBrandsChange(null);
        return;
      }
    } else {
      next.add(brand);
      if (next.size === brands.length) {
        onBrandsChange(null);
        return;
      }
    }
    onBrandsChange(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      onBrandsChange(new Set());
    } else {
      onBrandsChange(null);
    }
  };

  const handleSkip = () => {
    onBrandsChange(null);
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-center mb-1 text-white">メーカー選択</h2>
      <p className="text-slate-500 text-center mb-4 text-sm">
        気になるメーカーを選んでください（任意）
      </p>

      {/* Select all / Deselect all */}
      <div className="flex justify-end mb-3">
        <button
          onClick={toggleAll}
          className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
        >
          {allSelected ? "すべて解除" : "すべて選択"}
        </button>
      </div>

      {/* Brand grid */}
      <div className="grid grid-cols-2 gap-2 mb-6 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
        {brands.map((brand) => {
          const isSelected = allSelected || selectedBrands!.has(brand);
          return (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "bg-sky-500/10 text-sky-300 border border-sky-500/25"
                  : "bg-slate-800/40 text-slate-500 border border-transparent hover:bg-slate-700/40 hover:text-slate-400"
              }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                isSelected
                  ? "bg-sky-500 text-white"
                  : "border border-slate-600 bg-slate-800"
              }`}>
                {isSelected && (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="truncate">{brand}</span>
            </button>
          );
        })}
      </div>

      {!allSelected && selectedBrands!.size > 0 && (
        <p className="text-slate-500 text-center mb-4 text-xs">
          {selectedBrands!.size}ブランド選択中
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          戻る
        </Button>
        <button
          onClick={handleSkip}
          className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium transition-all duration-200 cursor-pointer text-sm border border-slate-700 hover:border-slate-600"
        >
          スキップ
        </button>
        {(!allSelected && selectedBrands!.size === 0) ? (
          <button
            disabled
            className="flex-1 px-6 py-3 rounded-xl font-medium bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
          >
            次へ
          </button>
        ) : (
          <Button onClick={onNext}>次へ</Button>
        )}
      </div>
    </div>
  );
}
