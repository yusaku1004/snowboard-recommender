"use client";

import { useMemo } from "react";
import { Board, Shape, FlexCategory } from "@/types";
import { Button } from "@/components/ui/Button";
import boardsData from "@/data/boards_data.json";

interface StepBrandsProps {
  selectedBrands: Set<string> | null;
  selectedShapes: Set<Shape> | null;
  selectedFlex: Set<FlexCategory> | null;
  onBrandsChange: (brands: Set<string> | null) => void;
  onShapesChange: (shapes: Set<Shape> | null) => void;
  onFlexChange: (flex: Set<FlexCategory> | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const ALL_SHAPES: { value: Shape; label: string }[] = [
  { value: "camber", label: "キャンバー" },
  { value: "rocker", label: "ロッカー" },
  { value: "flat", label: "フラット" },
  { value: "hybrid_camber", label: "ハイブリッドキャンバー" },
  { value: "double_camber", label: "ダブルキャンバー" },
];

const ALL_FLEX: { value: FlexCategory; label: string; desc: string }[] = [
  { value: "soft", label: "ソフト", desc: "1〜3" },
  { value: "mid", label: "ミドル", desc: "4〜6" },
  { value: "hard", label: "ハード", desc: "7〜10" },
];

export function StepBrands({
  selectedBrands,
  selectedShapes,
  selectedFlex,
  onBrandsChange,
  onShapesChange,
  onFlexChange,
  onNext,
  onBack,
}: StepBrandsProps) {
  const allBoards = boardsData as Board[];

  const brands = useMemo(() => {
    const seen = new Set<string>();
    allBoards.forEach((b) => seen.add(b.brand));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allBoards]);

  const allBrandsSelected = selectedBrands === null;
  const allShapesSelected = selectedShapes === null;
  const allFlexSelected = selectedFlex === null;

  const toggleBrand = (brand: string) => {
    const next = new Set(selectedBrands ?? brands);
    if (next.has(brand)) {
      next.delete(brand);
      if (next.size === 0) { onBrandsChange(null); return; }
    } else {
      next.add(brand);
      if (next.size === brands.length) { onBrandsChange(null); return; }
    }
    onBrandsChange(next);
  };

  const toggleShape = (shape: Shape) => {
    const all = ALL_SHAPES.map((s) => s.value);
    const next = new Set(selectedShapes ?? all);
    if (next.has(shape)) {
      next.delete(shape);
      if (next.size === 0) { onShapesChange(null); return; }
    } else {
      next.add(shape);
      if (next.size === ALL_SHAPES.length) { onShapesChange(null); return; }
    }
    onShapesChange(next);
  };

  const toggleFlex = (flex: FlexCategory) => {
    const all = ALL_FLEX.map((f) => f.value);
    const next = new Set(selectedFlex ?? all);
    if (next.has(flex)) {
      next.delete(flex);
      if (next.size === 0) { onFlexChange(null); return; }
    } else {
      next.add(flex);
      if (next.size === ALL_FLEX.length) { onFlexChange(null); return; }
    }
    onFlexChange(next);
  };

  const toggleAllBrands = () => {
    onBrandsChange(allBrandsSelected ? new Set() : null);
  };

  const handleSkip = () => {
    onBrandsChange(null);
    onShapesChange(null);
    onFlexChange(null);
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-center mb-1 text-white">こだわり条件</h2>
      <p className="text-slate-500 text-center mb-6 text-sm">
        形状・硬さ・メーカーを絞り込めます（任意）
      </p>

      {/* Shape filter */}
      <div className="mb-5">
        <p className="text-xs text-slate-400 mb-2 font-medium">形状</p>
        <div className="flex flex-wrap gap-2">
          {ALL_SHAPES.map((s) => {
            const isSelected = allShapesSelected || selectedShapes!.has(s.value);
            return (
              <button
                key={s.value}
                onClick={() => toggleShape(s.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                    : "bg-slate-800/60 text-slate-500 border-slate-700/50 hover:bg-slate-700/60"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Flex filter */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 mb-2 font-medium">フレックス（硬さ）</p>
        <div className="flex gap-2">
          {ALL_FLEX.map((f) => {
            const isSelected = allFlexSelected || selectedFlex!.has(f.value);
            return (
              <button
                key={f.value}
                onClick={() => toggleFlex(f.value)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border text-center ${
                  isSelected
                    ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                    : "bg-slate-800/60 text-slate-500 border-slate-700/50 hover:bg-slate-700/60"
                }`}
              >
                <div>{f.label}</div>
                <div className="text-[10px] opacity-60 mt-0.5">{f.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand selector */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 font-medium">メーカー</p>
          <button
            onClick={toggleAllBrands}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            {allBrandsSelected ? "すべて解除" : "すべて選択"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {brands.map((brand) => {
            const isSelected = allBrandsSelected || selectedBrands!.has(brand);
            return (
              <button
                key={brand}
                onClick={() => toggleBrand(brand)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all duration-200 ${
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
      </div>

      {!allBrandsSelected && selectedBrands!.size > 0 && (
        <p className="text-slate-500 text-center mb-3 text-xs">
          {selectedBrands!.size}ブランド選択中
        </p>
      )}

      {/* Buttons */}
      <div className="sticky bottom-0 pt-4 pb-2 safe-bottom bg-gradient-to-t from-[#0a1628] via-[#0a1628] to-transparent -mx-4 px-4">
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
          <Button onClick={onNext}>診断する</Button>
        </div>
      </div>
    </div>
  );
}
