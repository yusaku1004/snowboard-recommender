"use client";

import { useState } from "react";
import { RecommendResult, Board } from "@/types";
import { RadarChart } from "./RadarChart";
import { Tooltip } from "@/components/ui/Tooltip";
import { SHAPE_DESCRIPTIONS, FLEX_DESCRIPTIONS, getFlexCategory, getFlexLabel as flexLabel } from "@/lib/glossary";
import { RAKUTEN_AFF_ID, AMAZON_TAG, YAHOO_SID, YAHOO_PID } from "@/lib/constants";

interface BoardCardProps {
  result: RecommendResult;
  rank: number;
  budget: number;
  budgetFlexibility: number;
  myBoard?: Board | null;
  isFavorite?: boolean;
  onToggleFavorite?: (board: Board) => void;
  onFindSimilar?: (board: Board) => void;
  onFilterByBrand?: (brand: string) => void;
  isComparing?: boolean;
  onToggleCompare?: (board: Board) => void;
}

const SHAPE_LABELS: Record<string, string> = {
  camber: "キャンバー",
  rocker: "ロッカー",
  flat: "フラット",
  hybrid_camber: "HBキャンバー",
  hybrid_rocker: "HBロッカー",
  double_camber: "Wキャンバー",
};

const STYLE_TAG_LABELS: Record<string, string> = {
  ground_tricks: "グラトリ",
  park: "パーク",
  carving: "カービング",
  run_tricks: "ラントリ",
  powder: "パウダー",
};

function getTopStyleTag(styleScores: RecommendResult["board"]["style_scores"]): string | null {
  const entries = Object.entries(styleScores) as [string, number][];
  const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  if (top[1] >= 8) return STYLE_TAG_LABELS[top[0]] ?? null;
  return null;
}

// Affiliate search URL generators

function buildSearchQuery(brand: string, model: string): string {
  return `${brand} ${model} スノーボード`;
}

function getRakutenSearchUrl(brand: string, model: string): string {
  const query = encodeURIComponent(buildSearchQuery(brand, model));
  const targetUrl = `https://search.rakuten.co.jp/search/mall/${query}/`;
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFF_ID}/?pc=${encodeURIComponent(targetUrl)}&m=${encodeURIComponent(targetUrl)}`;
}

function getAmazonSearchUrl(brand: string, model: string): string {
  const query = encodeURIComponent(buildSearchQuery(brand, model));
  return `https://www.amazon.co.jp/s?k=${query}&tag=${AMAZON_TAG}`;
}

function getYahooSearchUrl(brand: string, model: string): string {
  const query = encodeURIComponent(buildSearchQuery(brand, model));
  const targetUrl = `https://shopping.yahoo.co.jp/search?p=${query}`;
  return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${YAHOO_SID}&pid=${YAHOO_PID}&vc_url=${encodeURIComponent(targetUrl)}`;
}

// Brand-based color for placeholder
const BRAND_COLORS = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
  "from-fuchsia-500 to-purple-600",
  "from-lime-500 to-green-600",
  "from-red-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

function getBrandColor(brand: string): string {
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = brand.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRAND_COLORS[Math.abs(hash) % BRAND_COLORS.length];
}

const GENDER_LABELS: Record<string, string> = {
  mens: "メンズ",
  womens: "レディース",
  unisex: "ユニセックス",
};

function getSeasonAge(year: number): number {
  const now = new Date();
  const currentSeasonYear =
    now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
  return currentSeasonYear - year;
}

function getYearsOldLabel(year: number): string | null {
  const yearsOld = getSeasonAge(year);
  if (yearsOld <= 0) return null;
  return `${yearsOld}年落ち`;
}

function getDiscountLabel(year: number): string {
  const yearsOld = getSeasonAge(year);
  if (yearsOld <= 0) return "10% OFF";
  if (yearsOld === 1) return "15% OFF";
  if (yearsOld === 2) return "30% OFF";
  return "40% OFF";
}

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: "bg-gradient-to-br from-amber-400 to-yellow-600", text: "text-amber-950", shadow: "shadow-amber-500/30" };
  if (rank === 2) return { bg: "bg-gradient-to-br from-slate-300 to-slate-400", text: "text-slate-800", shadow: "shadow-slate-400/20" };
  if (rank === 3) return { bg: "bg-gradient-to-br from-amber-600 to-amber-800", text: "text-amber-100", shadow: "shadow-amber-700/20" };
  return { bg: "bg-slate-800", text: "text-slate-400", shadow: "" };
}

function getMatchColor(pct: number): string {
  if (pct >= 80) return "from-emerald-400 to-cyan-400";
  if (pct >= 60) return "from-sky-400 to-blue-500";
  if (pct >= 40) return "from-amber-400 to-orange-500";
  return "from-slate-400 to-slate-500";
}


function getFlexDiff(target: number, mine: number): string | null {
  const diff = target - mine;
  if (diff === 0) return "同じ硬さ";
  const abs = Math.abs(diff);
  return diff > 0
    ? `${abs}段階硬い`
    : `${abs}段階柔らかい`;
}

export function BoardCard({ result, rank, budget, budgetFlexibility, myBoard, isFavorite = false, onToggleFavorite, onFindSimilar, onFilterByBrand, isComparing = false, onToggleCompare }: BoardCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { board, matchPercentage, recommendedSize, overBudget, estimatedPrice } = result;
  const topStyleTag = getTopStyleTag(board.style_scores);
  const hasDiscount = estimatedPrice < board.price;
  const effectiveBudget = budget * (1 + budgetFlexibility / 100);
  const yearsOldLabel = getYearsOldLabel(board.year);
  const rankStyle = getRankStyle(rank);

  type BudgetLabel = "within" | "sale_possible" | "over";
  let budgetLabel: BudgetLabel = "within";
  if (estimatedPrice > effectiveBudget) {
    budgetLabel = "over";
  } else if (estimatedPrice > budget) {
    budgetLabel = "sale_possible";
  }

  return (
    <div
      className={`fade-in-up bg-white/[0.04] backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
        rank <= 3
          ? "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]"
          : "border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.05]"
      }`}
      style={{ animationDelay: `${(rank - 1) * 80}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${rankStyle.bg} ${rankStyle.shadow} shadow-lg flex items-center justify-center`}>
            <span className={`${rankStyle.text} font-bold text-sm`}>{rank}</span>
          </div>

          {/* Board image or placeholder */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden">
            {board.image_url ? (
              <img
                src={board.image_url}
                alt={`${board.brand} ${board.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getBrandColor(board.brand)} flex items-center justify-center p-1 rounded-xl`}>
                <span className="text-white font-bold text-[9px] leading-tight text-center break-all drop-shadow-sm">
                  {board.brand}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">{board.brand}</span>
              <span className="text-[10px] text-slate-600">{board.year}</span>
              {budgetLabel === "over" && (
                <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">
                  予算オーバー
                </span>
              )}
              {budgetLabel === "sale_possible" && (
                <span className="text-[10px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                  セールで予算内
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white truncate mt-0.5">
              {board.model}
            </h3>
            {/* Match bar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`match-bar-fill h-full rounded-full bg-gradient-to-r ${getMatchColor(matchPercentage)}`}
                  style={{ width: `${matchPercentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-sky-400 tabular-nums w-14 text-right">
                {matchPercentage}%
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-xs text-slate-500">
                おすすめ <span className="text-slate-300 font-medium">{recommendedSize}cm</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[10px] text-slate-500 bg-slate-800/70 px-1.5 py-0.5 rounded-md">
                {SHAPE_LABELS[board.shape] || board.shape}
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-800/70 px-1.5 py-0.5 rounded-md">
                {flexLabel(board.flex)} flex
              </span>
              {topStyleTag && (
                <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                  {topStyleTag}◎
                </span>
              )}
            </div>
          </div>

          {/* Favorite + Compare + Expand */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5 mt-1">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(board); }}
                className="p-1 rounded-lg transition-colors cursor-pointer"
                aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
              >
                <svg
                  className={`w-4 h-4 transition-colors ${isFavorite ? "text-rose-400 fill-rose-400" : "text-slate-600 fill-none hover:text-rose-400"}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
            {onToggleCompare && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleCompare(board); }}
                className="p-1 rounded-lg transition-colors cursor-pointer"
                aria-label={isComparing ? "比較から外す" : "比較に追加"}
              >
                <svg
                  className={`w-4 h-4 transition-colors ${isComparing ? "text-emerald-400" : "text-slate-600 hover:text-emerald-400"}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {isComparing
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h4m6 0h4a2 2 0 012 2v10a2 2 0 01-2 2h-4m-6 4v-4m0-8v4m0 0H9m6 0h-6" />
                  }
                </svg>
              </button>
            )}
            <svg
              className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="expand-enter px-4 pb-4 border-t border-white/[0.06] pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <div className="bg-slate-800/40 rounded-xl p-3">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-slate-500">価格</span>
                <span className="text-[10px] font-semibold bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded-full">
                  {getDiscountLabel(board.year)}
                </span>
              </div>
              {hasDiscount ? (
                <div>
                  <p className="text-xs text-slate-600 line-through">
                    ¥{board.price.toLocaleString()}
                  </p>
                  <p className="text-sky-400 font-semibold">
                    ¥{estimatedPrice.toLocaleString()}
                    {yearsOldLabel && (
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({yearsOldLabel})
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-white font-semibold">
                  ¥{board.price.toLocaleString()}
                </p>
              )}
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3">
              <span className="text-xs text-slate-500">形状</span>
              <div className="mt-0.5">
                <Tooltip text={SHAPE_DESCRIPTIONS[board.shape] ?? ""}>
                  <span className="text-white font-medium text-sm">{SHAPE_LABELS[board.shape] || board.shape}</span>
                </Tooltip>
              </div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3">
              <span className="text-xs text-slate-500">フレックス</span>
              <Tooltip text={FLEX_DESCRIPTIONS[getFlexCategory(board.flex)]}>
                <div className="flex items-center gap-2 mt-0.5 flex-1">
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
                      style={{ width: `${board.flex * 10}%` }}
                    />
                  </div>
                  <span className="text-white font-medium text-sm tabular-nums">{board.flex}</span>
                </div>
              </Tooltip>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3">
              <span className="text-xs text-slate-500">対象</span>
              <p className="text-white font-medium text-sm">
                {GENDER_LABELS[board.gender] || board.gender}
              </p>
            </div>
            <div className="col-span-2 bg-slate-800/40 rounded-xl p-3">
              <span className="text-xs text-slate-500">サイズ展開</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {board.available_lengths.map((len) => (
                  <span
                    key={len}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      len === recommendedSize
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        : "bg-slate-700/60 text-slate-400"
                    }`}
                  >
                    {len}cm
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Radar chart */}
          <div className="mb-5">
            <p className="text-xs text-slate-500 mb-2 font-medium">スタイル適性</p>
            <RadarChart
              scores={board.style_scores}
              compareScores={myBoard?.style_scores}
              compareLabel="自分の板"
            />
          </div>

          {/* Comparison with my board */}
          {myBoard && (
            <div className="mb-5 bg-orange-500/5 border border-orange-500/15 rounded-xl p-3">
              <p className="text-xs text-orange-400 font-medium mb-2.5">
                {myBoard.brand} {myBoard.model} との比較
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/40 rounded-lg px-2.5 py-2">
                  <span className="text-slate-500">フレックス</span>
                  <p className="text-white font-medium mt-0.5">
                    {flexLabel(board.flex)}({board.flex})
                    <span className="text-orange-400 ml-1">
                      vs {flexLabel(myBoard.flex)}({myBoard.flex})
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {getFlexDiff(board.flex, myBoard.flex)}
                  </p>
                </div>
                <div className="bg-slate-800/40 rounded-lg px-2.5 py-2">
                  <span className="text-slate-500">形状</span>
                  <p className="text-white font-medium mt-0.5">
                    {SHAPE_LABELS[board.shape]}
                  </p>
                  {board.shape !== myBoard.shape ? (
                    <p className="text-[10px] text-orange-400 mt-0.5">
                      {SHAPE_LABELS[myBoard.shape]} → {SHAPE_LABELS[board.shape]}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">同じ形状</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EC search links */}
          <div className="flex flex-wrap gap-2">
            <a
              href={getRakutenSearchUrl(board.brand, board.model)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-[#BF0000]/10 text-[#ff4d4d] border border-[#BF0000]/20 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#BF0000]/20 transition-all"
            >
              楽天で探す
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            <a
              href={getAmazonSearchUrl(board.brand, board.model)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-[#FF9900]/10 text-[#FFB84D] border border-[#FF9900]/20 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#FF9900]/20 transition-all"
            >
              Amazonで探す
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            <a
              href={getYahooSearchUrl(board.brand, board.model)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-[#FF0033]/10 text-[#ff4d6a] border border-[#FF0033]/20 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#FF0033]/20 transition-all"
            >
              Yahoo!で探す
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>

          {/* Official page link */}
          {board.url && (
            <a
              href={board.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-block text-slate-500 hover:text-sky-400 text-xs mt-3 transition-colors"
            >
              公式ページ →
            </a>
          )}

          {/* Find similar / filter by brand */}
          {(onFindSimilar || onFilterByBrand) && (
            <div className={`mt-4 ${onFindSimilar && onFilterByBrand ? "grid grid-cols-2 gap-2" : ""}`}>
              {onFindSimilar && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFindSimilar(board); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 text-xs font-medium transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  似たボードを探す
                </button>
              )}
              {onFilterByBrand && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFilterByBrand(board.brand); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 text-xs font-medium transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0l-4-4m4 4l-4 4" />
                  </svg>
                  {board.brand}で絞り込む
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
