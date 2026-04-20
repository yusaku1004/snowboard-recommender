"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { UserInput, Board, Shape, FlexCategory, PriceRange, StyleScores, RecommendResult } from "@/types";
import { getRecommendations, getSimilarBoards, estimateDiscountedPrice } from "@/lib/recommend";
import { calculateIdealSize } from "@/lib/size";
import { calculateRecommendedSize } from "@/lib/size";
import { getShareUrl, getTwitterShareUrl, FilterState } from "@/lib/share";
import { BoardCard } from "@/components/results/BoardCard";
import { AiExplanation } from "@/components/results/AiExplanation";
import { RadarChart } from "@/components/results/RadarChart";
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
  { value: "hybrid_rocker", label: "ハイブリッドロッカー" },
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

const STYLE_BRAND_PRIORITY: Record<keyof StyleScores, Record<string, number>> = {
  ground_tricks: {
    "SPREAD": 100, "RICE28": 96, "FNTC": 92, "011 Artistic": 89, "NOVEMBER": 86,
    "YONEX": 83, "ALLIAN": 80, "GRAY": 77, "WRX SB": 74, "CROOJA": 71,
    "MOSS": 68, "SCOOTER": 65, "FANATIC": 62, "DEATH LABEL": 59, "BC STREAM": 56,
    "CAPITA": 53, "BURTON": 50, "GNU": 47,
    "AMICSS": 55, "NUMBER": 52, "ZUMA": 50, "KM4K": 48, "DOUBLEDECK": 46,
    "CANARY CARTEL": 44, "MAKUW": 44, "NOAH SNOWBOARDING JAPAN": 42, "atirom-avs": 40,
  },
  park: {
    "BURTON": 100, "CAPITA": 96, "SALOMON": 90, "BATALEON": 86, "GNU": 82,
    "LIB TECH": 78, "ROME": 75, "NITRO": 72, "ALLIAN": 68, "YES.": 65,
    "NIDECKER": 62, "RIDE": 59, "DEATH LABEL": 56, "LOBSTER": 53, "K2": 50,
    "NOVEMBER": 47, "DINOSAURS WILL DIE": 44,
    "SESSIONS": 48, "SG SNOWBOARDS": 44, "WHITESPACE": 50, "ThirtyTwo": 52,
    "CARDIFF SNOWCRAFT": 42, "FORUM": 46, "SLASH": 44,
  },
  carving: {
    "OGASAKA": 100, "MOSS": 95, "FANATIC": 90, "NOVEMBER": 85, "GRAY": 82,
    "YONEX": 79, "WRX SB": 76, "BC STREAM": 73, "SALOMON": 70, "BURTON": 67,
    "RICE28": 64, "SCOOTER": 61, "HEAD": 58, "K2": 55, "KORUA": 52,
    "ROSSIGNOL": 49, "ELAN": 46, "ALLIAN": 43,
    "KESSLER": 88, "SECCA": 55, "WEST SNOWBOARD": 50, "EnGuard": 48, "TWELVE": 46,
    "WHITESPACE": 52, "atirom-avs": 44,
  },
  run_tricks: {
    "WRX SB": 100, "RICE28": 97, "SPREAD": 94, "FNTC": 91, "011 Artistic": 88,
    "FANATIC": 84, "CROOJA": 81, "SALOMON": 78, "BURTON": 75, "CAPITA": 72,
    "OGASAKA": 69, "GRAY": 66, "NOVEMBER": 64, "DEVGRU": 62, "HOLIDAY": 60,
    "BC STREAM": 58, "GNU": 55, "LIB TECH": 53, "YONEX": 50, "K2": 47,
    "AMICSS": 58, "NUMBER": 55, "ZUMA": 52, "KM4K": 50, "CANARY CARTEL": 48,
    "MAKUW": 46, "atirom-avs": 44,
  },
  powder: {
    "GENTEMSTICK": 100, "MOSS SNOWSTICK": 98, "JONES": 95, "KORUA": 92, "WESTON": 88,
    "ARBOR": 85, "NEVER SUMMER": 83, "BURTON": 80, "SALOMON": 78, "K2": 75,
    "UNITED SHAPES": 73, "SEASON": 70, "AMPLID": 68, "ENDEAVOR": 65, "SIGNAL": 62,
    "GNU": 60, "LIB TECH": 58, "NITRO": 55, "BATALEON": 52,
    "CARDIFF SNOWCRAFT": 60, "WHITESPACE": 58, "WEST SNOWBOARD": 50,
    "NOAH SNOWBOARDING JAPAN": 48, "EnGuard": 46, "TELOS": 48,
  },
};

const STYLE_CHIPS: { key: keyof StyleScores | null; label: string; emoji: string }[] = [
  { key: null, label: "総合", emoji: "🏆" },
  { key: "ground_tricks", label: "グラトリ", emoji: "🛹" },
  { key: "park", label: "パーク", emoji: "🏂" },
  { key: "carving", label: "カービング", emoji: "⛷️" },
  { key: "run_tricks", label: "ラントリ", emoji: "🎿" },
  { key: "powder", label: "パウダー", emoji: "❄️" },
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
  const [favoriteToast, setFavoriteToast] = useState(false);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [showChipsFade, setShowChipsFade] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [resultStyle, setResultStyle] = useState<keyof StyleScores | null>(null);
  const [sortOrder, setSortOrder] = useState<"match" | "price_asc" | "price_desc" | "flex_asc" | "flex_desc">("match");
  const { isFavorite, toggleFavorite, count: favoriteCount } = useFavorites();
  const [selectedBrands, setSelectedBrands] = useState<Set<string> | null>(initialBrands);
  const [selectedShapes, setSelectedShapes] = useState<Set<Shape> | null>(initialShapes);
  const [selectedFlex, setSelectedFlex] = useState<Set<FlexCategory> | null>(initialFlex);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<Set<PriceRange> | null>(initialPriceRanges);
  const [selectedYears, setSelectedYears] = useState<Set<number> | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [myBoard, setMyBoard] = useState<Board | null>(null);
  const [similarRefBoard, setSimilarRefBoard] = useState<Board | null>(null);
  const [compareBoards, setCompareBoards] = useState<Board[]>([]);
  const [isCompareSheetOpen, setIsCompareSheetOpen] = useState(false);

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

  const availableYears = useMemo(() => {
    return [...new Set(allBoards.map((b) => b.year))].sort();
  }, [allBoards]);

  const allBrandsSelected = selectedBrands === null;
  const allShapesSelected = selectedShapes === null;
  const allFlexSelected = selectedFlex === null;
  const allPriceRangesSelected = selectedPriceRanges === null;
  const allYearsSelected = selectedYears === null;

  const toggleShape = (shape: Shape) => {
    const all = ALL_SHAPES.map((s) => s.value);
    setSelectedShapes((prev) => {
      const next = new Set(prev ?? all);
      if (next.has(shape)) { next.delete(shape); if (next.size === 0) return null; }
      else { next.add(shape); if (next.size === ALL_SHAPES.length) return null; }
      return next;
    });
  };

  const toggleFlex = (flex: FlexCategory) => {
    const all = ALL_FLEX.map((f) => f.value);
    setSelectedFlex((prev) => {
      const next = new Set(prev ?? all);
      if (next.has(flex)) { next.delete(flex); if (next.size === 0) return null; }
      else { next.add(flex); if (next.size === ALL_FLEX.length) return null; }
      return next;
    });
  };

  const togglePriceRange = (range: PriceRange) => {
    const all = ALL_PRICE_RANGES.map((p) => p.value);
    setSelectedPriceRanges((prev) => {
      const next = new Set(prev ?? all);
      if (next.has(range)) { next.delete(range); if (next.size === 0) return null; }
      else { next.add(range); if (next.size === ALL_PRICE_RANGES.length) return null; }
      return next;
    });
  };

  const toggleYear = (year: number) => {
    setSelectedYears((prev) => {
      const next = new Set(prev ?? availableYears);
      if (next.has(year)) { next.delete(year); if (next.size === 0) return null; }
      else { next.add(year); if (next.size === availableYears.length) return null; }
      return next;
    });
  };

  const activeFilterCount =
    (allBrandsSelected ? 0 : 1) +
    (allShapesSelected ? 0 : 1) +
    (allFlexSelected ? 0 : 1) +
    (allPriceRangesSelected ? 0 : 1) +
    (allYearsSelected ? 0 : 1);

  const favoriteResults = useMemo(() => {
    const favoriteBoards = allBoards.filter((b) => isFavorite(b));
    return getRecommendations(favoriteBoards, adjustedInput);
  }, [allBoards, adjustedInput, isFavorite]);

  // フィルター適用後のボード一覧（共通）
  const filteredBoards = useMemo(() => {
    let filtered = allBoards;
    if (!allBrandsSelected) filtered = filtered.filter((b) => selectedBrands!.has(b.brand));
    if (!allShapesSelected) filtered = filtered.filter((b) => selectedShapes!.has(b.shape));
    if (!allFlexSelected) filtered = filtered.filter((b) => matchesFlex(b.flex, selectedFlex!));
    if (!allPriceRangesSelected) {
      filtered = filtered.filter((b) =>
        matchesPriceRange(estimateDiscountedPrice(b.price, b.year), selectedPriceRanges!)
      );
    }
    if (!allYearsSelected) filtered = filtered.filter((b) => selectedYears!.has(b.year));
    return filtered;
  }, [allBoards, allBrandsSelected, selectedBrands, allShapesSelected, selectedShapes, allFlexSelected, selectedFlex, allPriceRangesSelected, selectedPriceRanges, allYearsSelected, selectedYears]);

  // 総合マッチ結果
  const overallResults = useMemo(
    () => getRecommendations(filteredBoards, adjustedInput),
    [filteredBoards, adjustedInput]
  );

  // スタイル別結果（スタイルスコア降順→同スコア時はブランド優先度）
  const styleResults = useMemo<RecommendResult[]>(() => {
    if (!resultStyle) return [];
    const priority = STYLE_BRAND_PRIORITY[resultStyle];
    const effectiveBudget = adjustedInput.budget * (1 + adjustedInput.budgetFlexibility / 100);
    const idealSize = calculateIdealSize(adjustedInput.height, adjustedInput.weight, adjustedInput.style);

    const mapped: RecommendResult[] = filteredBoards.map((board) => {
      const estimatedPrice = estimateDiscountedPrice(board.price, board.year);
      const recommendedSize = calculateRecommendedSize(
        adjustedInput.height,
        adjustedInput.weight,
        adjustedInput.style,
        board.available_lengths
      );
      const overBudget = estimatedPrice > effectiveBudget;
      const budgetPenalty = overBudget
        ? Math.min(((estimatedPrice - effectiveBudget) / effectiveBudget) * 50, 30)
        : 0;
      const minLengthDiff = Math.min(...board.available_lengths.map((l) => Math.abs(l - idealSize)));
      const sizePenalty = minLengthDiff <= 10 ? 0 : minLengthDiff <= 20 ? (minLengthDiff - 10) * 1.0 : 10 + (minLengthDiff - 20) * 1.5;
      // matchPercentage はスタイルスコア(1-10)→0-90 + ブランド優先度補正(0-5) - 各種ペナルティ
      const styleScore = board.style_scores[resultStyle] ?? 1;
      const brandBoost = ((priority[board.brand] ?? 0) / 100) * 5;
      const matchPercentage = Math.round(
        Math.max(0, Math.min(100, styleScore * 9 + brandBoost - budgetPenalty - sizePenalty)) * 10
      ) / 10;
      return { board, matchPercentage, recommendedSize, overBudget, estimatedPrice };
    });

    return mapped
      .sort((a, b) => {
        // 予算内を優先
        if (a.overBudget !== b.overBudget) return a.overBudget ? 1 : -1;
        // matchPercentage降順（= スタイルスコア→ブランド優先度の順）
        return b.matchPercentage - a.matchPercentage;
      })
      .slice(0, 30);
  }, [filteredBoards, resultStyle, adjustedInput]);

  const results = resultStyle ? styleResults : overallResults;

  const sortedResults = useMemo(() => {
    if (sortOrder === "match") return results;
    return [...results].sort((a, b) => {
      if (sortOrder === "price_asc") return a.estimatedPrice - b.estimatedPrice;
      if (sortOrder === "price_desc") return b.estimatedPrice - a.estimatedPrice;
      if (sortOrder === "flex_asc") return a.board.flex - b.board.flex;
      if (sortOrder === "flex_desc") return b.board.flex - a.board.flex;
      return 0;
    });
  }, [results, sortOrder]);

  const similarResults = useMemo(() => {
    if (!similarRefBoard) return [];
    return getSimilarBoards(similarRefBoard, allBoards, adjustedInput);
  }, [similarRefBoard, allBoards, adjustedInput]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev ?? brands);
      if (next.has(brand)) { next.delete(brand); }
      else { next.add(brand); if (next.size === brands.length) return null; }
      return next;
    });
  };

  const resetAllFilters = () => {
    setSelectedBrands(null);
    setSelectedShapes(null);
    setSelectedFlex(null);
    setSelectedPriceRanges(null);
    setSelectedYears(null);
    setShowAll(false);
  };

  const handleFilterByBrand = useCallback((brand: string) => {
    setSelectedBrands(new Set([brand]));
    setShowAll(false);
    setSortOrder("match");
  }, []);

  const handleToggleCompare = useCallback((board: Board) => {
    setCompareBoards((prev) => {
      const exists = prev.some((b) => b.brand === board.brand && b.model === board.model && b.year === board.year);
      if (exists) return prev.filter((b) => !(b.brand === board.brand && b.model === board.model && b.year === board.year));
      if (prev.length >= 2) return prev; // max 2
      return [...prev, board];
    });
  }, []);

  const currentFilters: FilterState = {
    brands: selectedBrands,
    shapes: selectedShapes,
    flex: selectedFlex,
    priceRanges: selectedPriceRanges,
  };

  const handleToggleFavorite = useCallback((board: Board) => {
    const wasAdded = !isFavorite(board);
    toggleFavorite(board);
    if (wasAdded) {
      setFavoriteToast(true);
      setTimeout(() => setFavoriteToast(false), 2000);
    }
  }, [isFavorite, toggleFavorite]);

  const handleChipsScroll = useCallback(() => {
    const el = chipsRef.current;
    if (!el) return;
    setShowChipsFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

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
  };

  const handleTwitterShare = () => {
    const topBoard = overallResults[0];
    if (!topBoard) return;
    const url = getTwitterShareUrl(input, `${topBoard.board.brand} ${topBoard.board.model}`);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-center mb-1 text-white">診断結果</h2>
      <p className="text-slate-500 text-center mb-3 text-sm">
        あなたにおすすめのボード
      </p>

      {/* Input summary chips */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {[
          `${adjustedInput.height}cm`,
          `${adjustedInput.weight}kg`,
          `${getTopStyleLabel(adjustedInput.style)}重視`,
          `¥${adjustedInput.budget.toLocaleString()}`,
        ].map((label) => (
          <span key={label} className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-full">
            {label}
          </span>
        ))}
      </div>

      {/* AI explanation (総合タブのみ表示) */}
      {!resultStyle && overallResults.length > 0 && (
        <AiExplanation input={adjustedInput} result={overallResults[0]} />
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
          <svg className={`w-4 h-4 transition-transform duration-200 ${isAdjustOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${isAdjustOpen ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-5 max-h-[480px] overflow-y-auto">
            <p className="text-xs text-slate-500 font-medium mb-4">変更するとリアルタイムで結果に反映されます</p>
            <Slider label="予算上限" value={localBudget} min={30000} max={200000} step={5000} formatValue={formatYen} onChange={setLocalBudget} />
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
        <MyBoardSelector boards={allBoards} selectedBoard={myBoard} onSelect={setMyBoard} />
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

      <BottomSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="絞り込み">
        {/* Year filter */}
        {availableYears.length > 1 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 font-medium">年式</p>
              {!allYearsSelected && (
                <button type="button" onClick={() => setSelectedYears(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">すべて選択</button>
              )}
            </div>
            <div className="flex gap-2">
              {availableYears.map((year) => {
                const isSelected = allYearsSelected || selectedYears!.has(year);
                return (
                  <button type="button" key={year} onClick={() => toggleYear(year)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border text-center ${isSelected ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "bg-slate-800/60 text-slate-500 border-slate-700/50"}`}>
                    {year}年
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price filter */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-medium">価格帯（推定）</p>
            {!allPriceRangesSelected && (
              <button type="button" onClick={() => setSelectedPriceRanges(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">すべて選択</button>
            )}
          </div>
          <div className="flex gap-2">
            {ALL_PRICE_RANGES.map((p) => {
              const isSelected = allPriceRangesSelected || selectedPriceRanges!.has(p.value);
              return (
                <button type="button" key={p.value} onClick={() => togglePriceRange(p.value)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border text-center ${isSelected ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "bg-slate-800/60 text-slate-500 border-slate-700/50"}`}>
                  {p.label}
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
              <button type="button" onClick={() => setSelectedShapes(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">すべて選択</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_SHAPES.map((s) => {
              const isSelected = allShapesSelected || selectedShapes!.has(s.value);
              return (
                <Tooltip key={s.value} text={SHAPE_DESCRIPTIONS[s.value]}>
                  <button type="button" onClick={() => toggleShape(s.value)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${isSelected ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "bg-slate-800/60 text-slate-500 border-slate-700/50"}`}>
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
              <button type="button" onClick={() => setSelectedFlex(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">すべて選択</button>
            )}
          </div>
          <div className="flex gap-2">
            {ALL_FLEX.map((f) => {
              const isSelected = allFlexSelected || selectedFlex!.has(f.value);
              return (
                <div key={f.value} className="flex-1 relative">
                  <button type="button" onClick={() => toggleFlex(f.value)} className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border text-center ${isSelected ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "bg-slate-800/60 text-slate-500 border-slate-700/50"}`}>
                    <div>{f.label}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{f.desc}</div>
                  </button>
                  <div className="absolute top-1 right-1">
                    <Tooltip text={FLEX_DESCRIPTIONS[f.value]}><span /></Tooltip>
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
            <div className="flex gap-3">
              {!allBrandsSelected && (
                <button type="button" onClick={() => setSelectedBrands(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">
                  すべて選択
                </button>
              )}
              {(allBrandsSelected || (selectedBrands !== null && selectedBrands.size > 0)) && (
                <button type="button" onClick={() => setSelectedBrands(new Set())} className="text-xs text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">
                  全解除
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => {
              const isSelected = allBrandsSelected || selectedBrands!.has(brand);
              return (
                <button type="button" key={brand} onClick={() => toggleBrand(brand)} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all duration-200 ${isSelected ? "bg-sky-500/10 text-sky-300 border border-sky-500/25" : "bg-slate-700/40 text-slate-500 border border-transparent"}`}>
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-sky-500 text-white" : "border border-slate-600 bg-slate-800"}`}>
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
          {!allBrandsSelected && selectedBrands!.size === 0 && (
            <p className="text-amber-500/70 text-center mt-2 text-xs">
              メーカーが選択されていません
            </p>
          )}
        </div>

        <button type="button" onClick={() => setIsFilterSheetOpen(false)} className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all cursor-pointer">
          適用する
        </button>
      </BottomSheet>

      {/* Similar boards BottomSheet */}
      <BottomSheet
        isOpen={similarRefBoard !== null}
        onClose={() => setSimilarRefBoard(null)}
        title={similarRefBoard ? `${similarRefBoard.brand} ${similarRefBoard.model} に似たボード` : ""}
      >
        {similarResults.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">類似ボードが見つかりませんでした</p>
        ) : (
          <div className="space-y-3">
            {similarResults.map((result, i) => (
              <BoardCard
                key={`similar-${result.board.brand}-${result.board.model}-${result.board.year}`}
                result={result}
                rank={i + 1}
                budget={adjustedInput.budget}
                budgetFlexibility={adjustedInput.budgetFlexibility}
                myBoard={myBoard}
                isFavorite={isFavorite(result.board)}
                onToggleFavorite={handleToggleFavorite}
                onFindSimilar={(board) => setSimilarRefBoard(board)}
              />
            ))}
          </div>
        )}
      </BottomSheet>

      {/* Compare BottomSheet */}
      <BottomSheet
        isOpen={isCompareSheetOpen}
        onClose={() => setIsCompareSheetOpen(false)}
        title="ボード比較"
      >
        {compareBoards.length === 2 && (() => {
          const [a, b] = compareBoards;
          const SHAPE_LABELS_C: Record<string, string> = {
            camber: "キャンバー", rocker: "ロッカー", flat: "フラット",
            hybrid_camber: "HBキャンバー", hybrid_rocker: "HBロッカー", double_camber: "Wキャンバー",
          };
          const recA = sortedResults.find((r) => r.board.brand === a.brand && r.board.model === a.model && r.board.year === a.year);
          const recB = sortedResults.find((r) => r.board.brand === b.brand && r.board.model === b.model && r.board.year === b.year);
          const rows: { label: string; valA: string; valB: string }[] = [
            { label: "形状", valA: SHAPE_LABELS_C[a.shape] || a.shape, valB: SHAPE_LABELS_C[b.shape] || b.shape },
            { label: "フレックス", valA: `${a.flex} (${a.flex <= 3 ? "ソフト" : a.flex <= 6 ? "ミドル" : "ハード"})`, valB: `${b.flex} (${b.flex <= 3 ? "ソフト" : b.flex <= 6 ? "ミドル" : "ハード"})` },
            { label: "価格（推定）", valA: `¥${estimateDiscountedPrice(a.price, a.year).toLocaleString()}`, valB: `¥${estimateDiscountedPrice(b.price, b.year).toLocaleString()}` },
            { label: "マッチ度", valA: recA ? `${recA.matchPercentage}%` : "—", valB: recB ? `${recB.matchPercentage}%` : "—" },
            { label: "おすすめサイズ", valA: recA ? `${recA.recommendedSize}cm` : "—", valB: recB ? `${recB.recommendedSize}cm` : "—" },
          ];
          return (
            <div>
              {/* Headers */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[a, b].map((board, idx) => (
                  <div key={idx} className={`rounded-xl p-3 text-center border ${idx === 0 ? "bg-sky-500/10 border-sky-500/25" : "bg-violet-500/10 border-violet-500/25"}`}>
                    <p className={`text-[10px] font-medium mb-0.5 ${idx === 0 ? "text-sky-400" : "text-violet-400"}`}>{board.brand}</p>
                    <p className="text-white text-xs font-bold leading-tight">{board.model}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{board.year}</p>
                  </div>
                ))}
              </div>
              {/* Spec rows */}
              <div className="space-y-1.5 mb-4">
                {rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className={`text-xs text-right px-2.5 py-2 rounded-xl bg-slate-800/50 ${row.valA === row.valB ? "text-slate-400" : "text-sky-300 font-medium"}`}>{row.valA}</div>
                    <span className="text-[10px] text-slate-600 text-center w-16 flex-shrink-0">{row.label}</span>
                    <div className={`text-xs text-left px-2.5 py-2 rounded-xl bg-slate-800/50 ${row.valA === row.valB ? "text-slate-400" : "text-violet-300 font-medium"}`}>{row.valB}</div>
                  </div>
                ))}
              </div>
              {/* Radar chart */}
              <p className="text-xs text-slate-500 font-medium text-center mb-1">スタイル適性比較</p>
              <RadarChart
                scores={a.style_scores}
                compareScores={b.style_scores}
                compareLabel={`${b.brand} ${b.model}`}
              />
            </div>
          );
        })()}
      </BottomSheet>

      {/* Compare floating bar */}
      {compareBoards.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm">
          <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
            <div className="flex gap-2 flex-1 min-w-0">
              {compareBoards.map((b, i) => (
                <div key={i} className={`flex-1 min-w-0 px-2 py-1 rounded-lg text-[10px] truncate border ${i === 0 ? "bg-sky-500/10 border-sky-500/20 text-sky-300" : "bg-violet-500/10 border-violet-500/20 text-violet-300"}`}>
                  <span className="font-medium">{b.brand}</span> {b.model}
                </div>
              ))}
              {compareBoards.length === 1 && (
                <div className="flex-1 px-2 py-1 rounded-lg text-[10px] border border-dashed border-slate-600 text-slate-600 flex items-center justify-center">
                  もう1枚選ぶ
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCompareBoards([])}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                type="button"
                disabled={compareBoards.length < 2}
                onClick={() => setIsCompareSheetOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-sky-500 text-white hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                比較する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === "results" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-400"}`}
        >
          診断結果
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("favorites")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "favorites" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-400"}`}
        >
          <svg className={`w-3.5 h-3.5 ${favoriteCount > 0 ? "text-rose-400 fill-rose-400" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          お気に入り
          {favoriteCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{favoriteCount}</span>
          )}
        </button>
      </div>

      {/* Favorites tab */}
      {activeTab === "favorites" && (
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
                onToggleFavorite={handleToggleFavorite}
                onFindSimilar={(board) => { setSimilarRefBoard(board); }}
              />
            ))}
          </div>
        )
      )}

      {/* Results tab */}
      {activeTab === "results" && (
        <>
          {/* Style chips */}
          <div className="relative mb-4">
            <div
              ref={chipsRef}
              onScroll={handleChipsScroll}
              className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1"
            >
              {STYLE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => { setResultStyle(chip.key); setShowAll(false); setSortOrder("match"); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
                    resultStyle === chip.key
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.15)]"
                      : "bg-slate-800/60 text-slate-500 border-slate-700/50 hover:text-slate-400"
                  }`}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
            {showChipsFade && (
              <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-[#0a1628] to-transparent pointer-events-none" />
            )}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-600 flex-shrink-0">並び替え</span>
            <div className="flex gap-1.5 flex-wrap">
              {([
                { value: "match", label: "マッチ度" },
                { value: "price_asc", label: "価格が安い順" },
                { value: "price_desc", label: "価格が高い順" },
                { value: "flex_asc", label: "flex 柔→硬" },
                { value: "flex_desc", label: "flex 硬→柔" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setSortOrder(opt.value); setShowAll(false); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                    sortOrder === opt.value
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                      : "bg-slate-800/60 text-slate-500 border-slate-700/50 hover:text-slate-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <p className="text-slate-500 text-center mb-4 text-xs">絞り込み中 — {sortedResults.length}件表示中</p>
          )}

          {sortedResults.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium mb-1">条件に合うボードが見つかりませんでした</p>
              <p className="text-slate-600 text-sm mb-5">絞り込み条件を緩めてみてください</p>
              <button type="button" onClick={resetAllFilters} className="px-5 py-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 text-sm font-medium hover:bg-sky-500/20 transition-all cursor-pointer">
                絞り込みをすべてリセット
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-3">
                {(showAll ? sortedResults : sortedResults.slice(0, 3)).map((result, i) => (
                  <BoardCard
                    key={`${result.board.brand}-${result.board.model}-${result.board.year}`}
                    result={result}
                    rank={i + 1}
                    budget={adjustedInput.budget}
                    budgetFlexibility={adjustedInput.budgetFlexibility}
                    myBoard={myBoard}
                    isFavorite={isFavorite(result.board)}
                    onToggleFavorite={handleToggleFavorite}
                    onFindSimilar={(board) => { setSimilarRefBoard(board); }}
                    onFilterByBrand={handleFilterByBrand}
                    isComparing={compareBoards.some((b) => b.brand === result.board.brand && b.model === result.board.model && b.year === result.board.year)}
                    onToggleCompare={handleToggleCompare}
                  />
                ))}
              </div>
              {sortedResults.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="w-full py-3 mb-4 rounded-xl border border-slate-700/50 bg-slate-800/40 text-slate-400 text-sm font-medium hover:bg-slate-700/40 hover:text-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {showAll ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                      TOP3だけ表示
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      残り{sortedResults.length - 3}件を表示
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </>
      )}

      {/* Share buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <button
          onClick={handleCopyUrl}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
            copied ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-700/60"
          }`}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
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

      {/* Favorite toast */}
      {favoriteToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-800 border border-slate-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl">
          <svg className="w-4 h-4 text-rose-400 fill-rose-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          お気に入りに追加しました
        </div>
      )}
    </div>
  );
}
