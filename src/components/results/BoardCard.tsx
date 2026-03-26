"use client";

import { useState } from "react";
import { RecommendResult } from "@/types";
import { RadarChart } from "./RadarChart";

interface BoardCardProps {
  result: RecommendResult;
  rank: number;
  budget: number;
  budgetFlexibility: number;
}

const SHAPE_LABELS: Record<string, string> = {
  camber: "キャンバー",
  rocker: "ロッカー",
  flat: "フラット",
  hybrid_camber: "ハイブリッドキャンバー",
  double_camber: "ダブルキャンバー",
};

// Affiliate search URL generators
const RAKUTEN_AFF_ID = "4f6d7a0c.02dfc7fe.4f6d7a0d.fb8f2dc4";
const AMAZON_TAG = "fsaunaswh-22";

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
  return `https://shopping.yahoo.co.jp/search?p=${query}`;
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

function getBrandInitial(brand: string): string {
  // Use first letter, or first 2 for short names
  const cleaned = brand.replace(/[^A-Za-z0-9]/g, "");
  return cleaned.substring(0, 2).toUpperCase();
}

const GENDER_LABELS: Record<string, string> = {
  mens: "メンズ",
  womens: "レディース",
  unisex: "ユニセックス",
};

function getYearsOldLabel(year: number): string | null {
  const now = new Date();
  const currentSeasonYear =
    now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
  const yearsOld = currentSeasonYear - year;
  if (yearsOld <= 0) return null;
  return `${yearsOld}年落ち`;
}

export function BoardCard({ result, rank, budget, budgetFlexibility }: BoardCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { board, matchPercentage, recommendedSize, overBudget, estimatedPrice } = result;
  const hasDiscount = estimatedPrice < board.price;
  const effectiveBudget = budget * (1 + budgetFlexibility / 100);
  const yearsOldLabel = getYearsOldLabel(board.year);

  // Label logic
  type BudgetLabel = "within" | "sale_possible" | "over";
  let budgetLabel: BudgetLabel = "within";
  if (estimatedPrice > effectiveBudget) {
    budgetLabel = "over";
  } else if (estimatedPrice > budget) {
    budgetLabel = "sale_possible";
  }

  return (
    <div
      className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] hover:border-white/20 hover:bg-white/[0.07] cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
            <span className="text-sky-400 font-bold">{rank}</span>
          </div>

          {/* Board image or placeholder */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden">
            {board.image_url ? (
              <img
                src={board.image_url}
                alt={`${board.brand} ${board.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getBrandColor(board.brand)} flex items-center justify-center p-1`}>
                <span className="text-white font-bold text-[9px] leading-tight text-center break-all drop-shadow-sm">
                  {board.brand}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">{board.brand}</span>
              <span className="text-xs text-slate-500">{board.year}</span>
              {budgetLabel === "over" && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  予算オーバー
                </span>
              )}
              {budgetLabel === "sale_possible" && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                  セールで予算内の可能性
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white truncate">
              {board.model}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="text-sky-400 font-bold">
                マッチ度 {matchPercentage}%
              </span>
              <span className="text-slate-400">
                おすすめ {recommendedSize}cm
              </span>
            </div>
          </div>

          {/* Expand indicator */}
          <div className="flex-shrink-0 text-slate-500">
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-4">
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-slate-400">価格</span>
              {hasDiscount ? (
                <div>
                  <p className="text-slate-500 text-xs line-through">
                    ¥{board.price.toLocaleString()}
                  </p>
                  <p className="text-sky-400 font-medium">
                    ¥{estimatedPrice.toLocaleString()}
                    {yearsOldLabel && (
                      <span className="text-xs text-slate-400 ml-1">
                        ({yearsOldLabel})
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-white font-medium">
                  ¥{board.price.toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <span className="text-slate-400">形状</span>
              <p className="text-white font-medium">
                {SHAPE_LABELS[board.shape] || board.shape}
              </p>
            </div>
            <div>
              <span className="text-slate-400">フレックス</span>
              <p className="text-white font-medium">{board.flex}/10</p>
            </div>
            <div>
              <span className="text-slate-400">対象</span>
              <p className="text-white font-medium">
                {GENDER_LABELS[board.gender] || board.gender}
              </p>
            </div>
            <div>
              <span className="text-slate-400">サイズ展開</span>
              <p className="text-white font-medium text-xs">
                {board.available_lengths.join(", ")}cm
              </p>
            </div>
          </div>

          {/* Radar chart */}
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2">スタイル適性</p>
            <RadarChart scores={board.style_scores} />
          </div>

          {/* EC search links */}
          <div className="flex flex-wrap gap-2">
            <a
              href={getRakutenSearchUrl(board.brand, board.model)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-[#BF0000]/15 text-[#ff4d4d] border border-[#BF0000]/30 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#BF0000]/25 transition-colors"
            >
              楽天で探す
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            <a
              href={getAmazonSearchUrl(board.brand, board.model)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-[#FF9900]/15 text-[#FFB84D] border border-[#FF9900]/30 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#FF9900]/25 transition-colors"
            >
              Amazonで探す
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            <a
              href={getYahooSearchUrl(board.brand, board.model)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-[#FF0033]/15 text-[#ff4d6a] border border-[#FF0033]/30 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#FF0033]/25 transition-colors"
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
              className="inline-block text-slate-400 hover:text-sky-400 text-xs mt-2 transition-colors"
            >
              公式ページ →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
