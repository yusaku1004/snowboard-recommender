"use client";

import { useState, useCallback } from "react";
import { UserInput, RecommendResult } from "@/types";

interface AiExplanationProps {
  input: UserInput;
  result: RecommendResult;
}

export function AiExplanation({ input, result }: AiExplanationProps) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  const fetchExplanation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExplanation("");
    setRequested(true);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height: input.height,
          weight: input.weight,
          level: input.level,
          style: Object.fromEntries(
            Object.entries(input.style).map(([k, v]) => [k, v * 2])
          ),
          board: {
            brand: result.board.brand,
            model: result.board.model,
            year: result.board.year,
            flex: result.board.flex,
            shape: result.board.shape,
            style_scores: result.board.style_scores,
          },
          matchPercentage: result.matchPercentage,
          recommendedSize: result.recommendedSize,
        }),
      });

      if (!res.ok) {
        setError(
          res.status === 429
            ? "混み合っています。少し時間をおいてからお試しください。"
            : "解説を生成できませんでした。"
        );
        setLoading(false);
        return;
      }

      const data = await res.json();
      setExplanation(data.text || "");
      setLoading(false);
    } catch {
      setError("通信に失敗しました。");
      setLoading(false);
    }
  }, [input, result]);

  if (!requested) {
    return (
      <div className="mb-5">
        <button
          onClick={fetchExplanation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold border border-violet-300/30 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/10 to-sky-500/20 text-violet-100 shadow-[0_8px_24px_-10px_rgba(139,92,246,0.7)] hover:brightness-125 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          AIにおすすめ理由を聞く
        </button>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="glass rounded-3xl p-4 border-violet-300/20 bg-gradient-to-br from-violet-500/10 to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-violet-400">AIによるおすすめ理由</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="inline-block w-1 h-4 bg-violet-400 animate-pulse" />
            生成中...
          </div>
        ) : error ? (
          <div className="text-sm text-slate-400">
            <p className="mb-2">{error}</p>
            <button
              type="button"
              onClick={fetchExplanation}
              className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer transition-colors"
            >
              もう一度試す
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}
