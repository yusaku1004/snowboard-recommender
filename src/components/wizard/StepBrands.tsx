"use client";

import { useMemo, useState } from "react";
import { Shape, FlexCategory } from "@/types";
import { StepFooter } from "@/components/ui/StepFooter";
import { Tooltip } from "@/components/ui/Tooltip";
import { SHAPE_DESCRIPTIONS, FLEX_DESCRIPTIONS } from "@/lib/glossary";
import { useBoards } from "@/hooks/useBoards";
import { matchesBrand } from "@/lib/brandSearch";
import { SearchInput } from "@/components/ui/SearchInput";

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
  { value: "hybrid_rocker", label: "ハイブリッドロッカー" },
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
  const { boards: allBoards } = useBoards();
  const [brandQuery, setBrandQuery] = useState("");

  const brands = useMemo(() => {
    const seen = new Set<string>();
    allBoards?.forEach((b) => seen.add(b.brand));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allBoards]);

  const visibleBrands = useMemo(
    () => brands.filter((brand) => matchesBrand(brand, brandQuery)),
    [brands, brandQuery]
  );

  const allBrandsSelected = selectedBrands === null;
  const allShapesSelected = selectedShapes === null;
  const allFlexSelected = selectedFlex === null;

  const toggleBrand = (brand: string) => {
    const next = new Set(selectedBrands ?? brands);
    if (next.has(brand)) {
      next.delete(brand);
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
    if (!allBrandsSelected) onBrandsChange(null);
  };

  const clearAllBrands = () => {
    onBrandsChange(new Set());
  };

  const handleSkip = () => {
    onBrandsChange(null);
    onShapesChange(null);
    onFlexChange(null);
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">こだわりはある？</h2>
      <p className="text-slate-400 mb-6 text-sm">形状・硬さ・メーカーで絞り込めます。なければスキップでOK</p>

      {/* Shape filter */}
      <div className="glass rounded-3xl p-4 mb-3">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 mb-2.5">形状</p>
        <div className="flex flex-wrap gap-2">
          {ALL_SHAPES.map((s) => {
            const isSelected = allShapesSelected || selectedShapes!.has(s.value);
            return (
              <Tooltip key={s.value} text={SHAPE_DESCRIPTIONS[s.value]}>
                <button type="button" onClick={() => toggleShape(s.value)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? "bg-sky-400/15 text-sky-200 border-sky-300/40"
                      : "bg-white/[0.05] text-slate-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Flex filter */}
      <div className="glass rounded-3xl p-4 mb-3">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 mb-2.5">フレックス（硬さ）</p>
        <div className="flex gap-2">
          {ALL_FLEX.map((f) => {
            const isSelected = allFlexSelected || selectedFlex!.has(f.value);
            return (
              <div key={f.value} className="flex-1 relative">
                <button type="button" onClick={() => toggleFlex(f.value)}
                  className={`w-full py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer border text-center ${
                    isSelected
                      ? "bg-sky-400/15 text-sky-200 border-sky-300/40"
                      : "bg-white/[0.05] text-slate-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div>{f.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5">{f.desc}</div>
                </button>
                <div className="absolute top-1 right-1">
                  <Tooltip text={FLEX_DESCRIPTIONS[f.value]}>
                    <span />
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand selector */}
      <div className="glass rounded-3xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400">メーカー</p>
          <div className="flex gap-3">
            {!allBrandsSelected && (
              <button
                type="button"
                onClick={toggleAllBrands}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
              >
                すべて選択
              </button>
            )}
            {(allBrandsSelected || (selectedBrands !== null && selectedBrands.size > 0)) && (
              <button
                type="button"
                onClick={clearAllBrands}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
              >
                全解除
              </button>
            )}
          </div>
        </div>
        <div className="mb-2.5">
          <SearchInput value={brandQuery} onChange={setBrandQuery} placeholder="メーカー名で検索（例: バートン）" label="メーカーを検索" />
        </div>
        {!allBoards && (
          <div className="grid grid-cols-2 gap-2" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-9 rounded-xl bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        )}
        {allBoards && visibleBrands.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">「{brandQuery}」に一致するメーカーはありません</p>
        )}
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {visibleBrands.map((brand) => {
            const isSelected = allBrandsSelected || selectedBrands!.has(brand);
            return (
              <button
                type="button"
                key={brand}
                onClick={() => toggleBrand(brand)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-sky-400/10 text-sky-100 border border-sky-300/30"
                    : "bg-white/[0.04] text-slate-400 border border-transparent hover:bg-white/10 hover:text-slate-400"
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? "bg-sky-500 text-white"
                    : "border border-white/20 bg-white/[0.06]"
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

      {!allBrandsSelected && selectedBrands!.size === 0 && (
        <p className="text-amber-500/70 text-center mb-3 text-xs">
          メーカーが選択されていません
        </p>
      )}
      {!allBrandsSelected && selectedBrands!.size > 0 && (
        <p className="text-slate-400 text-center mb-3 text-xs">
          {selectedBrands!.size}ブランド選択中
        </p>
      )}

      <div className="mb-6" />
      <StepFooter
        onNext={onNext}
        nextLabel="診断する"
        onBack={onBack}
        secondary={{ label: "スキップ", onClick: handleSkip }}
      />
    </div>
  );
}
