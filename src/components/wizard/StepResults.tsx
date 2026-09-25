"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { UserInput, SkillLevel, BootSize, Board, Shape, FlexCategory, PriceRange, StyleScores, RecommendResult } from "@/types";
import { getRecommendations, getSimilarBoards, getStyleRecommendations, estimateDiscountedPrice } from "@/lib/recommend";
import { getLineShareUrl, getShareUrl, getTwitterShareUrl, FilterState } from "@/lib/share";
import { BoardCard } from "@/components/results/BoardCard";
import { AiExplanation } from "@/components/results/AiExplanation";
import { RadarChart } from "@/components/results/LazyRadarChart";
import { MyBoardSelector } from "@/components/results/MyBoardSelector";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Slider } from "@/components/ui/Slider";
import { LevelPicker } from "@/components/ui/LevelPicker";
import { Segmented } from "@/components/ui/Segmented";
import { SearchInput } from "@/components/ui/SearchInput";
import { matchesBrand } from "@/lib/brandSearch";
import { applyFilters } from "@/lib/filters";
import { trackEvent } from "@/lib/analytics";
import { STYLE_ICONS, STYLE_KEYS, STYLE_LABELS, getStyleSummary } from "@/lib/styles";
import { useFavorites } from "@/hooks/useFavorites";
import { Tooltip } from "@/components/ui/Tooltip";
import { SHAPE_DESCRIPTIONS, FLEX_DESCRIPTIONS, getFlexLabel } from "@/lib/glossary";
import { useBoards } from "@/hooks/useBoards";

const BOOT_SIZE_LABELS: Record<BootSize, string> = {
  small: "〜26.5cm",
  medium: "27〜27.5cm",
  large: "28cm〜",
};

const LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: "初心者",
  intermediate: "中級者",
  advanced: "上級者",
};


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

const STYLE_CHIPS: { key: keyof StyleScores | null; label: string; emoji: string }[] = [
  { key: null, label: "総合", emoji: "🏆" },
  ...STYLE_KEYS.map((key) => ({ key, label: STYLE_LABELS[key], emoji: STYLE_ICONS[key] })),
];

interface StepResultsProps {
  input: UserInput;
  onRestart: () => void;
  // 共有URLから開いた（自分ではない人の条件の）結果か
  sharedView?: boolean;
  aiEnabled?: boolean;
  initialBrands?: Set<string> | null;
  initialShapes?: Set<Shape> | null;
  initialFlex?: Set<FlexCategory> | null;
  initialPriceRanges?: Set<PriceRange> | null;
}

const STYLE_ITEMS: { key: keyof StyleScores; label: string }[] = [
  { key: "ground_tricks", label: "グラトリ" },
  { key: "park", label: "パーク" },
  { key: "carving", label: "カービング" },
  { key: "run_tricks", label: "ラントリ" },
  { key: "powder", label: "パウダー" },
];

type SortOrder = "match" | "price_asc" | "price_desc" | "flex_asc" | "flex_desc";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "match", label: "マッチ度順" },
  { value: "price_asc", label: "価格が安い順" },
  { value: "price_desc", label: "価格が高い順" },
  { value: "flex_asc", label: "柔らかい順" },
  { value: "flex_desc", label: "硬い順" },
];

const shareTileClass =
  "flex flex-col items-center justify-center gap-1.5 min-w-0 px-1 py-3 rounded-2xl text-xs font-medium leading-tight text-center transition-all duration-200 cursor-pointer active:scale-95 glass text-slate-200 hover:bg-white/10";

function toolTileClass(active: boolean): string {
  return `flex flex-col items-center justify-center gap-1.5 min-w-0 px-1 py-3 rounded-2xl text-xs font-medium leading-tight text-center transition-all duration-200 cursor-pointer active:scale-95 ${
    active
      ? "bg-sky-400/15 text-sky-200 border border-sky-300/40 shadow-[0_6px_20px_-8px_rgba(56,189,248,0.6)]"
      : "glass text-slate-300 hover:bg-white/10"
  }`;
}

function formatYen(value: number): string {
  return `¥${value.toLocaleString()}`;
}

export function StepResults(props: StepResultsProps) {
  const { boards, failed, retry } = useBoards();
  return (
    <>
      {/* 共有URLの案内はボードデータに依存しないので、データ読み込みを待たずに表示する */}
      {props.sharedView && <SharedResultBanner onRestart={props.onRestart} />}
      {boards ? (
        <StepResultsContent {...props} allBoards={boards} />
      ) : (
        <ResultsLoading failed={failed} onRetry={retry} />
      )}
    </>
  );
}

function SharedResultBanner({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="mb-5 rounded-3xl p-4 bg-gradient-to-r from-violet-500/15 via-sky-500/10 to-cyan-400/15 border border-sky-300/25">
      <p className="text-sm font-semibold text-white mb-1">シェアされた診断結果です</p>
      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        下の条件で診断した結果です。あなたの体格やスタイルで診断すると、おすすめの板とサイズは変わります。
      </p>
      <Button onClick={onRestart} className="w-full py-3">
        自分の条件で診断する（約1分）
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Button>
    </div>
  );
}

function ResultsLoading({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  if (failed) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <p className="text-white font-semibold mb-1">ボードデータを読み込めませんでした</p>
        <p className="text-slate-400 text-sm mb-5">通信状況を確認して、もう一度お試しください</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-full bg-sky-400/15 text-sky-200 border border-sky-300/40 text-sm font-medium hover:bg-sky-400/20 transition-all cursor-pointer"
        >
          再読み込み
        </button>
      </div>
    );
  }
  return (
    <div aria-busy="true" aria-label="診断結果を計算中">
      <div className="h-3 w-16 rounded-full bg-white/10 mb-3 animate-pulse" />
      <div className="h-7 w-56 rounded-full bg-white/10 mb-5 animate-pulse" />
      <div className="glass rounded-[28px] h-72 mb-3 animate-pulse" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass rounded-3xl h-32 mb-3 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}

function StepResultsContent({
  allBoards,
  sharedView = false,
  aiEnabled = false,
  input,
  onRestart,
  initialBrands = null,
  initialShapes = null,
  initialFlex = null,
  initialPriceRanges = null,
}: StepResultsProps & { allBoards: Board[] }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "favorites">("results");
  const [favoriteToast, setFavoriteToast] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [resultStyle, setResultStyle] = useState<keyof StyleScores | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("match");
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
  const [localHeight, setLocalHeight] = useState(input.height);
  const [localWeight, setLocalWeight] = useState(input.weight);
  const [localStyle, setLocalStyle] = useState<StyleScores>(input.style);
  const [localLevel, setLocalLevel] = useState<SkillLevel>(input.level);
  const [brandQuery, setBrandQuery] = useState("");

  const hasAdjustments =
    localBudget !== input.budget ||
    localHeight !== input.height ||
    localWeight !== input.weight ||
    localLevel !== input.level ||
    (Object.keys(localStyle) as (keyof StyleScores)[]).some((k) => localStyle[k] !== input.style[k]);

  const adjustedInput = useMemo<UserInput>(
    () => ({ ...input, height: localHeight, weight: localWeight, budget: localBudget, style: localStyle, level: localLevel }),
    [input, localHeight, localWeight, localBudget, localStyle, localLevel]
  );


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
  const filteredBoards = useMemo(
    () =>
      applyFilters(allBoards, {
        brands: selectedBrands,
        shapes: selectedShapes,
        flex: selectedFlex,
        priceRanges: selectedPriceRanges,
        years: selectedYears,
      }),
    [allBoards, selectedBrands, selectedShapes, selectedFlex, selectedPriceRanges, selectedYears]
  );

  // 総合マッチ結果
  const overallResults = useMemo(
    () => getRecommendations(filteredBoards, adjustedInput),
    [filteredBoards, adjustedInput]
  );

  // スタイル別結果（予算内優先→スタイルスコア→ブランド優先度）
  const styleResults = useMemo<RecommendResult[]>(
    () => (resultStyle ? getStyleRecommendations(filteredBoards, adjustedInput, resultStyle) : []),
    [filteredBoards, resultStyle, adjustedInput]
  );

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

  // Analytics: 診断結果の表示（最初の1回だけ）
  const resultTracked = useRef(false);
  useEffect(() => {
    if (resultTracked.current) return;
    resultTracked.current = true;
    const top = overallResults[0];
    trackEvent("result_view", {
      level: adjustedInput.level,
      style: getStyleSummary(adjustedInput.style),
      shared: sharedView,
      top_board: top ? `${top.board.brand} ${top.board.model}` : null,
    });
  }, [overallResults, adjustedInput, sharedView]);

  // 選択中のタブ（総合 / スタイル別）の1位をヒーローとして上部に表示し、同じ並びのリストからは除く
  const heroResult = (resultStyle ? styleResults[0] : overallResults[0]) ?? null;
  const heroInList = sortOrder === "match" && heroResult !== null;
  const listResults = heroInList ? sortedResults.slice(1) : sortedResults;
  const rankOffset = heroInList ? 1 : 0;

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

  // 条件チップのタップ → 調整パネルを開いてそこへスクロール
  const openAdjustPanel = useCallback(() => {
    setIsAdjustOpen(true);
    setTimeout(() => document.getElementById("adjust-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  const handleFilterByBrand = useCallback((brand: string) => {
    setSelectedBrands(new Set([brand]));
    setShowAll(false);
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

  const handleCopyUrl = async () => {
    trackEvent("share", { method: "copy_link" });
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

  // スマホでは端末の共有シート（LINE・Instagram などを含む）を使い、非対応ならリンクをコピー
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const handleNativeShare = async () => {
    const topBoard = overallResults[0];
    trackEvent("share", { method: "native" });
    try {
      await navigator.share({
        title: "スノーボード診断",
        text: topBoard ? `スノーボード診断で「${topBoard.board.brand} ${topBoard.board.model}」がおすすめされました！` : "スノーボード診断",
        url: getShareUrl(adjustedInput, currentFilters),
      });
    } catch {
      // キャンセル時などは何もしない
    }
  };

  const handleLineShare = () => {
    trackEvent("share", { method: "line" });
    window.open(getLineShareUrl(adjustedInput, currentFilters), "_blank", "noopener,noreferrer");
  };

  const handleTwitterShare = () => {
    trackEvent("share", { method: "x" });
    const topBoard = overallResults[0];
    if (!topBoard) return;
    const url = getTwitterShareUrl(adjustedInput, `${topBoard.board.brand} ${topBoard.board.model}`, currentFilters);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-sky-300/90 mb-1">{sharedView ? "SHARED RESULT" : "RESULT"}</p>
      <h2 className="text-2xl font-bold text-white mb-3">{sharedView ? "この条件のおすすめ" : "あなたにぴったりの一本"}</h2>

      {/* Input summary chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {[
          `${adjustedInput.height}cm`,
          `${adjustedInput.weight}kg`,
          LEVEL_LABELS[adjustedInput.level],
          getStyleSummary(adjustedInput.style),
          `¥${adjustedInput.budget.toLocaleString()}`,
          ...(adjustedInput.bootSize ? [`ブーツ ${BOOT_SIZE_LABELS[adjustedInput.bootSize]}`] : []),
        ].map((label) => (
          <button
            key={label}
            type="button"
            onClick={openAdjustPanel}
            aria-label={`${label}（タップして条件を変更）`}
            className="text-xs text-slate-300 bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-full hover:bg-white/10 hover:border-sky-300/40 transition-colors cursor-pointer"
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={openAdjustPanel}
          className="text-xs text-sky-300 px-1.5 py-1 hover:text-sky-200 cursor-pointer"
        >
          変更
        </button>
      </div>

      {/* Wide board caution for large boots */}
      {(adjustedInput.bootSize === "large" || adjustedInput.bootSize === "medium") && (
        <div role="note" className="mb-4 rounded-2xl p-3.5 flex items-start gap-3 bg-amber-400/10 border border-amber-300/30">
          <svg className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-amber-50 leading-relaxed">
            {adjustedInput.bootSize === "large"
              ? "ブーツ28cm以上は、通常幅の板だとつま先やかかとが雪面に当たりやすく、ワイドモデル（「W」「Wide」表記）が合うことが多いです。購入前にウエスト幅（目安 26cm以上）を確認してください。"
              : "ブーツ27〜27.5cmは、板によってはつま先やかかとが雪面に当たることがあります。購入前にウエスト幅（目安 25.5cm以上）を確認すると安心です。"}
          </p>
        </div>
      )}

      {/* Hero: overall best match */}
      {heroResult && (
        <div id="best-match" className="mb-3 scroll-mt-4">
          <BoardCard
            featured
            featuredLabel={resultStyle ? `${STYLE_LABELS[resultStyle]} 1位` : "BEST MATCH"}
            result={heroResult}
            rank={1}
            budget={adjustedInput.budget}
            budgetFlexibility={adjustedInput.budgetFlexibility}
            myBoard={myBoard}
            isFavorite={isFavorite(heroResult.board)}
            onToggleFavorite={handleToggleFavorite}
            onFindSimilar={(board) => { setSimilarRefBoard(board); }}
            onFilterByBrand={handleFilterByBrand}
            isComparing={compareBoards.some((b) => b.brand === heroResult.board.brand && b.model === heroResult.board.model && b.year === heroResult.board.year)}
            onToggleCompare={handleToggleCompare}
          />
        </div>
      )}

      {/* AI explanation (総合タブのみ表示) */}
      {aiEnabled && !resultStyle && overallResults.length > 0 && (
        <AiExplanation input={adjustedInput} result={overallResults[0]} />
      )}

      {/* Toolbar: adjust / compare with my board / filter */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          type="button"
          onClick={() => setIsAdjustOpen((v) => !v)}
          aria-expanded={isAdjustOpen}
          className={toolTileClass(hasAdjustments || isAdjustOpen)}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {hasAdjustments ? "条件を変更中" : "条件を調整"}
        </button>
        <MyBoardSelector boards={allBoards} selectedBoard={myBoard} onSelect={setMyBoard} triggerClassName={toolTileClass(myBoard !== null)} />
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className={toolTileClass(activeFilterCount > 0 || sortOrder !== "match")}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {activeFilterCount > 0 ? `絞り込み中 (${activeFilterCount})` : sortOrder !== "match" ? "並び替え中" : "並び替え・絞り込み"}
        </button>
      </div>

      {/* Inline adjustment panel */}
      <div id="adjust-panel" className={`scroll-mt-4 overflow-hidden transition-all duration-300 ${isAdjustOpen ? "max-h-[900px] opacity-100 mb-5" : "max-h-0 opacity-0 mb-2"}`}>
        <div className="glass rounded-3xl p-5 max-h-[880px] overflow-y-auto">
          <p className="text-xs text-slate-400 mb-4">変更するとリアルタイムで結果に反映されます</p>
          <Slider label="身長" value={localHeight} min={140} max={200} step={1} unit="cm" onChange={setLocalHeight} />
          <Slider label="体重" value={localWeight} min={30} max={120} step={1} unit="kg" onChange={setLocalWeight} />
          <div className="mb-5">
            <p className="text-sm font-semibold text-white mb-2">レベル</p>
            <Segmented
              label="レベル"
              options={(Object.keys(LEVEL_LABELS) as SkillLevel[]).map((value) => ({ value, label: LEVEL_LABELS[value] }))}
              value={localLevel}
              onChange={setLocalLevel}
            />
          </div>
          <Slider label="予算上限" value={localBudget} min={50000} max={200000} step={5000} formatValue={formatYen} onChange={setLocalBudget} />
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {STYLE_ITEMS.map((item) => (
              <LevelPicker
                key={item.key}
                label={item.label}
                value={localStyle[item.key]}
                onChange={(v) => setLocalStyle((prev) => ({ ...prev, [item.key]: v }))}
              />
            ))}
          </div>
          {hasAdjustments && (
            <button
              type="button"
              onClick={() => {
                setLocalHeight(input.height);
                setLocalWeight(input.weight);
                setLocalBudget(input.budget);
                setLocalStyle(input.style);
                setLocalLevel(input.level);
              }}
              className="mt-3 text-xs text-slate-400 hover:text-sky-300 transition-colors cursor-pointer underline underline-offset-2"
            >
              元の条件に戻す
            </button>
          )}
        </div>
      </div>

      <BottomSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="並び替え・絞り込み">
        {/* Sort */}
        <div className="mb-5">
          <p className="text-xs text-slate-400 font-medium mb-2">並び替え</p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setSortOrder(opt.value); setShowAll(false); }}
                aria-pressed={sortOrder === opt.value}
                className={`px-3 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  sortOrder === opt.value
                    ? "bg-sky-400/15 text-sky-200 border-sky-300/40"
                    : "bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

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
                  <button type="button" key={year} onClick={() => toggleYear(year)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border text-center ${isSelected ? "bg-sky-400/15 text-sky-200 border-sky-300/40" : "bg-white/[0.05] text-slate-400 border-white/10"}`}>
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
                <button type="button" key={p.value} onClick={() => togglePriceRange(p.value)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border text-center ${isSelected ? "bg-sky-400/15 text-sky-200 border-sky-300/40" : "bg-white/[0.05] text-slate-400 border-white/10"}`}>
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
                  <button type="button" onClick={() => toggleShape(s.value)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${isSelected ? "bg-sky-400/15 text-sky-200 border-sky-300/40" : "bg-white/[0.05] text-slate-400 border-white/10"}`}>
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
            <p className="text-xs text-slate-400 font-medium">硬さ（フレックス）</p>
            {!allFlexSelected && (
              <button type="button" onClick={() => setSelectedFlex(null)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">すべて選択</button>
            )}
          </div>
          <div className="flex gap-2">
            {ALL_FLEX.map((f) => {
              const isSelected = allFlexSelected || selectedFlex!.has(f.value);
              return (
                <div key={f.value} className="flex-1 relative">
                  <button type="button" onClick={() => toggleFlex(f.value)} className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border text-center ${isSelected ? "bg-sky-400/15 text-sky-200 border-sky-300/40" : "bg-white/[0.05] text-slate-400 border-white/10"}`}>
                    <div>{f.label}</div>
                    <div className="text-xs opacity-60 mt-0.5">{f.desc}</div>
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
          <div className="mb-2">
            <SearchInput value={brandQuery} onChange={setBrandQuery} placeholder="メーカー名で検索（例: バートン）" label="メーカーを検索" />
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {brands.filter((brand) => matchesBrand(brand, brandQuery)).map((brand) => {
              const isSelected = allBrandsSelected || selectedBrands!.has(brand);
              return (
                <button type="button" key={brand} onClick={() => toggleBrand(brand)} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all duration-200 ${isSelected ? "bg-sky-400/10 text-sky-100 border border-sky-300/30" : "bg-white/[0.07] text-slate-400 border border-transparent"}`}>
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-sky-500 text-white" : "border border-white/20 bg-white/[0.06]"}`}>
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

        <button type="button" onClick={() => setIsFilterSheetOpen(false)} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold shadow-[0_10px_30px_-8px_rgba(56,189,248,0.65)] hover:brightness-110 transition-all cursor-pointer">
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
          <p className="text-slate-400 text-sm text-center py-6">類似ボードが見つかりませんでした</p>
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
            { label: "硬さ", valA: `${a.flex} (${getFlexLabel(a.flex)})`, valB: `${b.flex} (${getFlexLabel(b.flex)})` },
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
                    <p className={`text-xs font-medium mb-0.5 ${idx === 0 ? "text-sky-400" : "text-violet-400"}`}>{board.brand}</p>
                    <p className="text-white text-xs font-bold leading-tight">{board.model}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{board.year}</p>
                  </div>
                ))}
              </div>
              {/* Spec rows */}
              <div className="space-y-1.5 mb-4">
                {rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className={`text-xs text-right px-2.5 py-2 rounded-xl bg-white/[0.05] ${row.valA === row.valB ? "text-slate-400" : "text-sky-300 font-medium"}`}>{row.valA}</div>
                    <span className="text-xs text-slate-400 text-center w-16 flex-shrink-0">{row.label}</span>
                    <div className={`text-xs text-left px-2.5 py-2 rounded-xl bg-white/[0.05] ${row.valA === row.valB ? "text-slate-400" : "text-violet-300 font-medium"}`}>{row.valB}</div>
                  </div>
                ))}
              </div>
              {/* Radar chart */}
              <p className="text-xs text-slate-400 font-medium text-center mb-1">スタイル適性比較</p>
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
          <div className="bg-[#0f1830]/85 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
            <div className="flex gap-2 flex-1 min-w-0">
              {compareBoards.map((b, i) => (
                <div key={i} className={`flex-1 min-w-0 px-2 py-1 rounded-lg text-xs truncate border ${i === 0 ? "bg-sky-500/10 border-sky-500/20 text-sky-300" : "bg-violet-500/10 border-violet-500/20 text-violet-300"}`}>
                  <span className="font-medium">{b.brand}</span> {b.model}
                </div>
              ))}
              {compareBoards.length === 1 && (
                <div className="flex-1 px-2 py-1 rounded-lg text-xs border border-dashed border-white/20 text-slate-400 flex items-center justify-center">
                  もう1枚選ぶ
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCompareBoards([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
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
      <div className="flex gap-1 glass rounded-2xl p-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "results" ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" : "text-slate-400 hover:text-slate-200"}`}
        >
          診断結果
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("favorites")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "favorites" ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" : "text-slate-400 hover:text-slate-200"}`}
        >
          <svg className={`w-3.5 h-3.5 ${favoriteCount > 0 ? "text-rose-400 fill-rose-400" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          お気に入り
          {favoriteCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{favoriteCount}</span>
          )}
        </button>
      </div>

      {/* Favorites tab */}
      {activeTab === "favorites" && (
        favoriteCount === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium mb-1">お気に入りはまだありません</p>
            <p className="text-slate-400 text-sm">カードのハートボタンで保存できます</p>
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
            <div className="flex gap-2 overflow-x-auto pt-1 pb-3 -mx-4 px-4 [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-2.5rem),transparent)]">
              {STYLE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => { setResultStyle(chip.key); setShowAll(false); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    resultStyle === chip.key
                      ? "bg-gradient-to-r from-sky-400/30 to-cyan-400/20 text-white border-sky-300/50 shadow-[0_4px_16px_-6px_rgba(56,189,248,0.7)]"
                      : "bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {(activeFilterCount > 0 || sortOrder !== "match") && (
            <div className="flex items-center justify-between gap-2 mb-4 px-1 text-xs text-slate-300">
              <span>
                {sortOrder !== "match" && `${SORT_OPTIONS.find((o) => o.value === sortOrder)?.label}で表示`}
                {sortOrder !== "match" && activeFilterCount > 0 && " ・ "}
                {activeFilterCount > 0 && `絞り込み中（${sortedResults.length}件）`}
              </span>
              <button
                type="button"
                onClick={() => { setSortOrder("match"); resetAllFilters(); }}
                className="flex-shrink-0 text-sky-300 hover:text-sky-200 cursor-pointer"
              >
                リセット
              </button>
            </div>
          )}

          {sortedResults.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium mb-1">条件に合うボードが見つかりませんでした</p>
              <p className="text-slate-400 text-sm mb-3">
                {!allBrandsSelected && selectedBrands!.size <= 3
                  ? "メーカーを追加するか、全ブランドに戻してみてください"
                  : !allPriceRangesSelected
                  ? "価格帯の条件を広げてみてください"
                  : !allShapesSelected
                  ? "形状フィルターを増やしてみてください"
                  : "絞り込み条件を緩めてみてください"}
              </p>
              <button type="button" onClick={resetAllFilters} className="px-5 py-2.5 rounded-full bg-sky-400/15 text-sky-200 border border-sky-300/40 text-sm font-medium hover:bg-sky-400/20 transition-all cursor-pointer">
                絞り込みをすべてリセット
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-3">
                {listResults.length > 0 && heroInList && (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs font-medium text-slate-400">2位以降</p>
                    <button
                      type="button"
                      onClick={() => document.getElementById("best-match")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200 cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                      1位を見る
                    </button>
                  </div>
                )}
                {(showAll ? listResults : listResults.slice(0, 3)).map((result, i) => (
                  <BoardCard
                    key={`${result.board.brand}-${result.board.model}-${result.board.year}`}
                    result={result}
                    rank={i + 1 + rankOffset}
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
              {listResults.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="w-full py-3.5 mb-6 rounded-2xl glass text-slate-300 text-sm font-medium hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {showAll ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                      TOP3だけ表示
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      残り{listResults.length - 3}件を表示
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </>
      )}

      {/* Share buttons */}
      <p className="text-xs font-semibold tracking-wider text-slate-400 mb-2">結果をシェア</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {canNativeShare ? (
          <button type="button" onClick={handleNativeShare} className={shareTileClass}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12l-4 4m4-4l4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
            </svg>
            共有する
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCopyUrl}
            className={copied ? `${shareTileClass} !bg-emerald-500/15 !text-emerald-300 !border-emerald-400/30` : shareTileClass}
          >
            {copied ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            )}
            {copied ? "コピー済み" : "リンクをコピー"}
          </button>
        )}
        <button type="button" onClick={handleTwitterShare} className={shareTileClass}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Xでシェア
        </button>
        <button
          type="button"
          onClick={handleLineShare}
          className={`${shareTileClass} !bg-[#06C755]/15 !border-[#06C755]/40 !text-[#7ee2a8] hover:!bg-[#06C755]/25`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 3.96 3.55 7.28 8.35 7.9.33.07.77.22.88.5.1.26.07.65.03.9l-.14.86c-.04.26-.2 1 .88.55 1.08-.46 5.83-3.43 7.95-5.88C21.43 14.22 22 12.68 22 11c0-4.42-4.48-8-10-8z" />
          </svg>
          LINEで送る
        </button>
      </div>

      <Button onClick={onRestart} className="w-full py-4 text-base">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4v6h6M20 20v-6h-6" />
          <path d="M20 10a8 8 0 00-14.9-3M4 14a8 8 0 0014.9 3" />
        </svg>
        {sharedView ? "自分の条件で診断する" : "もう一度診断する"}
      </Button>

      {/* Favorite toast */}
      {favoriteToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#0f1830]/90 backdrop-blur-xl border border-white/15 text-white text-sm px-4 py-2.5 rounded-2xl shadow-2xl">
          <svg className="w-4 h-4 text-rose-400 fill-rose-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          お気に入りに追加しました
        </div>
      )}
    </div>
  );
}
