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
      <h2 className="text-2xl font-bold text-center mb-2">メーカー選択</h2>
      <p className="text-slate-400 text-center mb-4 text-sm">
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
      <div className="grid grid-cols-2 gap-2 mb-6 max-h-80 overflow-y-auto pr-1">
        {brands.map((brand) => {
          const isSelected = allSelected || selectedBrands!.has(brand);
          return (
            <label
              key={brand}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                isSelected
                  ? "bg-sky-500/15 text-sky-300"
                  : "bg-slate-700/50 text-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleBrand(brand)}
                className="accent-sky-500 w-4 h-4 shrink-0"
              />
              <span className="truncate">{brand}</span>
            </label>
          );
        })}
      </div>

      {!allSelected && selectedBrands!.size > 0 && (
        <p className="text-slate-400 text-center mb-4 text-xs">
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
          className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors cursor-pointer text-sm"
        >
          スキップ（全メーカー）
        </button>
        {(!allSelected && selectedBrands!.size === 0) ? (
          <button
            disabled
            className="flex-1 px-6 py-3 rounded-lg font-medium bg-slate-700 text-slate-500 cursor-not-allowed"
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
