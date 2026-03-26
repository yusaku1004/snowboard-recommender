"use client";

import { useMemo, useState } from "react";
import { UserInput, Board } from "@/types";
import { getRecommendations } from "@/lib/recommend";
import { getShareUrl, getTwitterShareUrl } from "@/lib/share";
import { BoardCard } from "@/components/results/BoardCard";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import boardsData from "@/data/boards_data.json";

interface StepResultsProps {
  input: UserInput;
  onRestart: () => void;
  initialBrands?: Set<string> | null;
}

export function StepResults({ input, onRestart, initialBrands = null }: StepResultsProps) {
  const [copied, setCopied] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string> | null>(initialBrands);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const allBoards = boardsData as Board[];

  const baseResults = useMemo(() => {
    return getRecommendations(allBoards, input);
  }, [allBoards, input]);

  const brands = useMemo(() => {
    const seen = new Set<string>();
    allBoards.forEach((b) => seen.add(b.brand));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allBoards]);

  const allSelected = selectedBrands === null;

  const results = useMemo(() => {
    if (allSelected) return baseResults;
    const filtered = allBoards.filter((b) => selectedBrands!.has(b.brand));
    return getRecommendations(filtered, input);
  }, [allBoards, input, allSelected, selectedBrands, baseResults]);

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

      {/* Brand filter trigger */}
      <div className="flex justify-center mb-5">
        <button
          onClick={() => setIsSheetOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
            allSelected
              ? "bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700/60"
              : "bg-sky-500/10 text-sky-400 border-sky-500/30"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {allSelected
            ? "メーカーで絞り込む"
            : `${selectedBrands!.size}件選択中`}
        </button>
      </div>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="メーカーで絞り込む"
      >
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setSelectedBrands(allSelected ? new Set() : null)}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            {allSelected ? "すべて解除" : "すべて選択"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {brands.map((brand) => {
            const isSelected = allSelected || selectedBrands!.has(brand);
            return (
              <label
                key={brand}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-sky-500/10 text-sky-300 border border-sky-500/25"
                    : "bg-slate-700/40 text-slate-500 border border-transparent"
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
              </label>
            );
          })}
        </div>
        <button
          onClick={() => setIsSheetOpen(false)}
          className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all cursor-pointer"
        >
          適用する
        </button>
      </BottomSheet>

      {!allSelected && (
        <p className="text-slate-500 text-center mb-4 text-xs">
          {selectedBrands!.size}ブランドで再検索 — {results.length}件表示中
        </p>
      )}

      <div className="space-y-3 mb-8">
        {results.map((result, i) => (
          <BoardCard key={`${result.board.brand}-${result.board.model}`} result={result} rank={i + 1} budget={input.budget} budgetFlexibility={input.budgetFlexibility} />
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
