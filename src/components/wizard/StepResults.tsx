"use client";

import { useMemo, useState } from "react";
import { UserInput, Board, Shape, FlexCategory, PriceRange, StyleScores } from "@/types";
import { getRecommendations, estimateDiscountedPrice } from "@/lib/recommend";
import { getShareUrl, getTwitterShareUrl, FilterState } from "@/lib/share";
import { BoardCard } from "@/components/results/BoardCard";
import { AiExplanation } from "@/components/results/AiExplanation";
import { MyBoardSelector } from "@/components/results/MyBoardSelector";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Slider } from "@/components/ui/Slider";
import { useFavorites } from "@/hooks/useFavorites";
import { Tooltip } from "@/components/ui/Tooltip";
import { SHAPE_DESCRIPTIONS, FLEX_DESCRIPTIONS } from "@/lib/glossary";
import boardsData from "@/data/boards_data.json";

const STYLE_LABELS: Record<keyof StyleScores, string> = {
  ground_tricks: "グラトリ",
  park: "パーク",
  carving: "カービング",
  run_tricks: "ラントリ",
  powder: "パウダー",
};

function getTopStyleLabel(style: StyleScores): string {
  const top = (Object.keys(style) as (keyof StyleScores)[]).reduce((a, b) =>
    style[a] >= style[b] ? a : b
  );
  return STYLE_LABELS[top];
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

const ALL_PRICE_RANGES: { value: PriceRange; label: string; desc: string }[] = [
  { value: "under50", label: "〜5万", desc: "¥50,000未満" },
  { value: "50to80", label: "5〜8万", desc: "¥50,000〜80,000" },
  { value: "80to100", label: "8〜10万", desc: "¥80,000〜100,000" },
  { value: "over100", label: "10万〜", desc: "¥100,000以上" },
];

function matchesPriceRange(estimatedPrice: number, ranges: Set<PriceRange>): boolean {
  if (ranges.has("under50") && estimatedPrice < 50000) return true;
  if (ranges.has("50to80") && estimatedPrice >= 50000 && estimatedPrice < 80000) return true;
  if (ranges.has("80to100") && estimatedPrice >= 80000 && estimatedPrice < 100000) return true;
  if (ranges.has("over100") && estimatedPrice >= 100000) return true;
  return false;
}

interface StepResultsProps {
  input: UserInput;
  onRestart: () => void;
  initialBrands?: Set<string> | null;
  initialShapes?: Set<Shape> | null;
  initialFlex?: Set<FlexCategory> | null;
  initialPriceRanges?: Set<PriceRange> | null;
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

const STYLE_ITEMS: { key: keyof StyleScores; label: string }[] = [
  { key: "ground_tricks", label: "グラトリ" },
  { key: "park", label: "パーク" },
  { key: "carving", label: "カービング" },
  { key: "run_tricks", label: "ラントリ" },
  { key: "powder", label: "パウダー" },
];

function formatYen(value: number): string {
  return `¥${value.toLocaleString()}`;
}

export function StepResults({
  input,
  onRestart,
  initialBrands = null,
  initialShapes = null,
  initialFlex = null,
  initialPriceRanges = null,
}: StepResultsProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "favorites">("results");
  const { isFavorite, toggleFavorite, count: favoriteCount } = useFavorites();
  const [selectedBrands, setSelectedBrands] = useState<Set<string> | null>(initialBrands);
  const [selectedShapes, setSelectedShapes] = useState<Set<Shape> | null>(initialShapes);
  const [selectedFlex, setSelectedFlex] = useState<Set<FlexCategory> | null>(initialFlex);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<Set<PriceRange> | null>(initialPriceRanges);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [myBoard, setMyBoard] = useState<Board | null>(null);

  // Inline adjustment state
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [localBudget, setLocalBudget] = useState(input.budget);
  const [localStyle, setLocalStyle] = useState<StyleScores>(input.style);

  const hasAdjustments =
    localBudget !== input.budget ||
    (Object.keys(localStyle) as (keyof StyleScores)[]).some((k) => localStyle[k] !== input.style[k]);

  const adjustedInput = useMemo<UserInput>(
    () => ({ ...input, budget: localBudget, style: localStyle }),
    [input, localBudget, localStyle]
  );

  const allBoards = boardsData as Board[];

  const brands = useMemo(() => {
    const seen = new Set<string>();
    allBoards.forEach((b) => seen.add(b.brand));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allBoards]);

  const allBrandsSelected = selectedBrands === null;
  const allShapesSelected = selectedShapes === null;
  const allFlexSelected = selectedFlex === null;
  const allPriceRangesSelected = selectedPriceRanges === null;

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

  const togglePriceRange = (range: PriceRange) => {
    const all = ALL_PRICE_RANGES.map((p) => p.value);
    setSelectedPriceRanges((prev) => {
      const next = new Set(prev ?? all);
      if (next.has(range)) {
        next.delete(range);
        if (next.size === 0) return null;
      } else {
        next.add(range);
        if (next.size === ALL_PRICE_RANGES.length) return null;
      }
      return next;
    });
  };

  const activeFilterCount =
    (allBrandsSelected ? 0 : 1) +
    (allShapesSelected ? 0 : 1) +
    (allFlexSelected ? 0 : 1) +
    (allPriceRangesSelected ? 0 : 1);

  const favoriteResults = useMemo(() => {
    const favoriteBoards = allBoards.filter((b) => isFavorite(b));
    return getRecommendations(favoriteBoards, adjustedInput);
  }, [allBoards, adjustedInput, isFavorite]);

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
    if (!allPriceRangesSelected) {
      filtered = filtered.filter((b) =>
        matchesPriceRange(estimateDiscountedPrice(b.price, b.year), selectedPriceRanges!)
      );
    }
    return getRecommendations(filtered, adjustedInput);
  }, [allBoards, adjustedInput, allBrandsSelected, selectedBrands, allShapesSelected, selectedShapes, allFlexSelected, selectedFlex, allPriceRangesSelected, selectedPriceRanges]);

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

  const resetAllFilters = () => {
    setSelectedBrands(null);
    setSelectedShapes(null);
    setSelectedFlex(null);
    setSelectedPriceRanges(null);
  };

  const currentFilters: FilterState = {
    brands: selectedBrands,
    shapes: selectedShapes,
    flex: selectedFlex,
    priceRanges: selectedPriceRanges,
  };

  const handleCopyUrl = async () => {
    const url = getShareUrl(adjustedInput, currentFilters);
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
      <p className="text-slate-500 text-center mb-3 text-sm">
        あなたにおすすめのボード TOP10
      </p>

      {/* Input summary chips */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {[
          `${adjustedInput.height}cm`,
          `${adjustedInput.weight}kg`,
          `${getTopStyleLabel(adjustedInput.style)}重視`,
          `¥${adjustedInput.budget.toLocaleString()}`,
        ].map((label) => (
          <span
            key={label}
            className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-full"
          >
            {label}
          </span>
        ))}
      </div>

      {/* AI explanation for top result */}
      {results.length > 0 && (
        <AiExplanation input={adjustedInput} result={results[0]} />
      )}

      {/* Inline adjustment panel */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setIsAdjustOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
            hasAdjustments
              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
              : "bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700/60"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            診断条件を調整
            {hasAdjustments && (
              <span className="px-1.5 py-0.5 bg-sky-500 text-white text-[10px] font-bold rounded-full">変更中</span>
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isAdjustOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${isAdjustOpen ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-5 max-h-[480px] overflow-y-auto">
            <p className="text-xs text-slate-500 font-medium mb-4">変更するとリアルタイムで結果に反映されます</p>
            <Slider
              label="予算上限"
              value={localBudget}
              min={30000}
              max={200000}
              step={5000}
              formatValue={formatYen}
              onChange={setLocalBudget}
            />
            <div className="border-t border-white/[0.06] my-4" />
            {STYLE_ITEMS.map((item) => (
              <Slider
                key={item.key}
                label={item.label}
                value={localStyle[item.key]}
                min={1}
                max={5}
                step={1}
                onChange={(v) => setLocalStyle((prev) => ({ ...prev, [item.key]: v }))}
              />
            ))}
            {hasAdjustments && (
              <button
                type="button"
                onClick={() => { setLocalBudget(input.budget); setLocalStyle(input.style); }}
                className="mt-2 text-xs text-slate-500 hover:text-sky-400 transition-colors cursor-pointer underline underline-offset-2"
              >
                元の条件に戻す
              </button>
            )}
          </div>
        </div>
      </div>

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
        {/* Price filter */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-medium">価格帯（推定）</p>
            {!allPriceRangesSelected && (
              <button onClick={() => setSelectedPriceRanges(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">
                すべて選択
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {ALL_PRICE_RANGES.map((p) => {
              const isSelected = allPriceRangesSelected || selectedPriceRanges!.has(p.value);
              return (
                <button
                  key={p.value}
                  onClick={() => togglePriceRange(p.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border text-center ${
                    isSelected
                      ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                      : "bg-slate-800/60 text-slate-500 border-slate-700/50"
                  }`}
                >
                  <div>{p.label}</div>
                </button>
              );
            })}
          </div>
        </div>

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
                <Tooltip key={s.value} text={SHAPE_DESCRIPTIONS[s.value]}>
                  <button
                    onClick={() => toggleShape(s.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                        : "bg-slate-800/60 text-slate-500 border-slate-700/50"
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
                <div key={f.value} className="flex-1 relative">
                  <button
                    onClick={() => toggleFlex(f.value)}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border text-center ${
                      isSelected
                        ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                        : "bg-slate-800/60 text-slate-500 border-slate-700/50"
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

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === "results"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          診断結果
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("favorites")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "favorites"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          <svg className={`w-3.5 h-3.5 ${favoriteCount > 0 ? "text-rose-400 fill-rose-400" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          お気に入り
          {favoriteCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {favoriteCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "favorites" ? (
        favoriteCount === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-600 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium mb-1">お気に入りはまだありません</p>
            <p className="text-slate-600 text-sm">カードのハートボタンで保存できます</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {favoriteResults.map((result, i) => (
              <BoardCard
                key={`fav-${result.board.brand}-${result.board.model}-${result.board.year}`}
                result={result}
                rank={i + 1}
                budget={adjustedInput.budget}
                budgetFlexibility={adjustedInput.budgetFlexibility}
                myBoard={myBoard}
                isFavorite={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )
      ) : (
        <>
      {activeFilterCount > 0 && (
        <p className="text-slate-500 text-center mb-4 text-xs">
          絞り込み中 — {results.length}件表示中
        </p>
      )}

      {results.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium mb-1">条件に合うボードが見つかりませんでした</p>
          <p className="text-slate-600 text-sm mb-5">絞り込み条件を緩めてみてください</p>
          <button
            onClick={resetAllFilters}
            className="px-5 py-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 text-sm font-medium hover:bg-sky-500/20 transition-all cursor-pointer"
          >
            絞り込みをすべてリセット
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {results.map((result, i) => (
            <BoardCard
              key={`${result.board.brand}-${result.board.model}-${result.board.year}`}
              result={result}
              rank={i + 1}
              budget={adjustedInput.budget}
              budgetFlexibility={adjustedInput.budgetFlexibility}
              myBoard={myBoard}
              isFavorite={isFavorite(result.board)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
        </>
      )}

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
