"use client";

import { useMemo, useState } from "react";
import { UserInput, Board, Shape, FlexCategory } from "@/types";
import { getRecommendations } from "@/lib/recommend";
import { getShareUrl, getTwitterShareUrl } from "@/lib/share";
import { BoardCard } from "@/components/results/BoardCard";
import { AiExplanation } from "@/components/results/AiExplanation";
import { MyBoardSelector } from "@/components/results/MyBoardSelector";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import boardsData from "@/data/boards_data.json";

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

interface StepResultsProps {
  input: UserInput;
  onRestart: () => void;
  initialBrands?: Set<string> | null;
  initialShapes?: Set<Shape> | null;
  initialFlex?: Set<FlexCategory> | null;
}

const FLEX_RANGES: Record<FlexCategory, [number, number]> = {
  soft: [1, 3],
  mid: [4, 6],
  hard: [7, 10],
};

function matchesFlex(flex: number, categories: Set<FlexCategory>): boolean {
  for (const cat of categories) {
    const [min, max] = FLEX_RANGES[cat];
    if (flex >= min && flex <= max) return true;
  }
  return false;
}

export function StepResults({
  input,
  onRestart,
  initialBrands = null,
  initialShapes = null,
  initialFlex = null,
}: StepResultsProps) {
  const [copied, setCopied] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string> | null>(initialBrands);
  const [selectedShapes, setSelectedShapes] = useState<Set<Shape> | null>(initialShapes);
  const [selectedFlex, setSelectedFlex] = useState<Set<FlexCategory> | null>(initialFlex);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [myBoard, setMyBoard] = useState<Board | null>(null);

  const allBoards = boardsData as Board[];

  const brands = useMemo(() => {
    const seen = new Set<string>();
    allBoards.forEach((b) => seen.add(b.brand));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allBoards]);

  const allBrandsSelected = selectedBrands === null;

  const allShapesSelected = selectedShapes === null;
  const allFlexSelected = selectedFlex === null;

  const toggleShape = (shape: Shape) => {
    const all = ALL_SHAPES.map((s) => s.value);
    setSelectedShapes((prev) => {
      const next = new Set(prev ?? all);
      if (next.has(shape)) {
        next.delete(shape);
        if (next.size === 0) return null;
      } else {
        next.add(shape);
        if (next.size === ALL_SHAPES.length) return null;
      }
      return next;
    });
  };

  const toggleFlex = (flex: FlexCategory) => {
    const all = ALL_FLEX.map((f) => f.value);
    setSelectedFlex((prev) => {
      const next = new Set(prev ?? all);
      if (next.has(flex)) {
        next.delete(flex);
        if (next.size === 0) return null;
      } else {
        next.add(flex);
        if (next.size === ALL_FLEX.length) return null;
      }
      return next;
    });
  };

  const activeFilterCount =
    (allBrandsSelected ? 0 : 1) +
    (allShapesSelected ? 0 : 1) +
    (allFlexSelected ? 0 : 1);

  const results = useMemo(() => {
    let filtered = allBoards;
    if (!allBrandsSelected) {
      filtered = filtered.filter((b) => selectedBrands!.has(b.brand));
    }
    if (!allShapesSelected) {
      filtered = filtered.filter((b) => selectedShapes!.has(b.shape));
    }
    if (!allFlexSelected) {
      filtered = filtered.filter((b) => matchesFlex(b.flex, selectedFlex!));
    }
    return getRecommendations(filtered, input);
  }, [allBoards, input, allBrandsSelected, selectedBrands, allShapesSelected, selectedShapes, allFlexSelected, selectedFlex]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev ?? brands);
      if (next.has(brand)) {
        next.delete(brand);
        if (next.size === 0) return null;
      } else {
        next.add(brand);
        if (next.size === brands.length) return null;
      }
      return next;
    });
  };

  const handleCopyUrl = async () => {
    const url = getShareUrl(input);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    // Analytics: share button clicked
  };

  const handleTwitterShare = () => {
    const topBoard = results[0];
    if (!topBoard) return;
    const url = getTwitterShareUrl(
      input,
      `${topBoard.board.brand} ${topBoard.board.model}`
    );
    window.open(url, "_blank", "noopener,noreferrer");
    // Analytics: twitter share clicked
  };

  // Analytics: results displayed

  return (
    <div>
      <h2 className="text-xl font-bold text-center mb-1 text-white">診断結果</h2>
      <p className="text-slate-500 text-center mb-4 text-sm">
        あなたにおすすめのボード TOP10
      </p>

      {/* AI explanation for top result */}
      {results.length > 0 && (
        <AiExplanation input={input} result={results[0]} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <MyBoardSelector
          boards={allBoards}
          selectedBoard={myBoard}
          onSelect={setMyBoard}
        />
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
            activeFilterCount > 0
              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
              : "bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700/60"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {activeFilterCount > 0 ? `絞り込み中 (${activeFilterCount})` : "絞り込む"}
        </button>
      </div>

      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="絞り込み"
      >
        {/* Shape filter */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-medium">形状</p>
            {!allShapesSelected && (
              <button onClick={() => setSelectedShapes(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">
                すべて選択
              </button>
            )}
          </div>
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
                      : "bg-slate-800/60 text-slate-500 border-slate-700/50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Flex filter */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-medium">フレックス（硬さ）</p>
            {!allFlexSelected && (
              <button onClick={() => setSelectedFlex(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">
                すべて選択
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {ALL_FLEX.map((f) => {
              const isSelected = allFlexSelected || selectedFlex!.has(f.value);
              return (
                <button
                  key={f.value}
                  onClick={() => toggleFlex(f.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border text-center ${
                    isSelected
                      ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                      : "bg-slate-800/60 text-slate-500 border-slate-700/50"
                  }`}
                >
                  <div>{f.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5">{f.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand filter */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-medium">メーカー</p>
            <button
              onClick={() => setSelectedBrands(allBrandsSelected ? new Set() : null)}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            >
              {allBrandsSelected ? "すべて解除" : "すべて選択"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => {
              const isSelected = allBrandsSelected || selectedBrands!.has(brand);
              return (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-sky-500/10 text-sky-300 border border-sky-500/25"
                      : "bg-slate-700/40 text-slate-500 border border-transparent"
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? "bg-sky-500 text-white" : "border border-slate-600 bg-slate-800"
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

        <button
          onClick={() => setIsFilterSheetOpen(false)}
          className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all cursor-pointer"
        >
          適用する
        </button>
      </BottomSheet>

      {activeFilterCount > 0 && (
        <p className="text-slate-500 text-center mb-4 text-xs">
          絞り込み中 — {results.length}件表示中
        </p>
      )}

      <div className="space-y-3 mb-4">
        {results.map((result, i) => (
          <BoardCard key={`${result.board.brand}-${result.board.model}-${result.board.year}`} result={result} rank={i + 1} budget={input.budget} budgetFlexibility={input.budgetFlexibility} myBoard={myBoard} />
        ))}
      </div>

      {/* Share buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <button
          onClick={handleCopyUrl}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
            copied
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
              : "bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-700/60"
          }`}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
          {copied ? "コピーしました" : "結果をシェア"}
        </button>
        <button
          onClick={handleTwitterShare}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700/60 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-sm font-medium"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Xでシェア
        </button>
      </div>

      <div className="flex justify-center">
        <Button onClick={onRestart}>もう一度診断する</Button>
      </div>
    </div>
  );
}
