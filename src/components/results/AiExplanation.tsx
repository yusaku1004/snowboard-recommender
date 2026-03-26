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
  const [error, setError] = useState(false);
  const [requested, setRequested] = useState(false);

  const fetchExplanation = useCallback(async () => {
    setLoading(true);
    setError(false);
    setExplanation("");
    setRequested(true);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height: input.height,
          weight: input.weight,
          style: input.style,
          board: {
            brand: result.board.brand,
            model: result.board.model,
            flex: result.board.flex,
            shape: result.board.shape,
            style_scores: result.board.style_scores,
          },
          matchPercentage: result.matchPercentage,
          recommendedSize: result.recommendedSize,
        }),
      });

      if (!res.ok) {
        setError(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setExplanation(data.text || "");
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [input, result]);

  if (!requested) {
    return (
      <div className="mb-5">
        <button
          onClick={fetchExplanation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/15 transition-all duration-200 cursor-pointer"
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
      <div className="bg-violet-500/[0.06] border border-violet-500/15 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-violet-400">AIによるおすすめ理由</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-block w-1 h-4 bg-violet-400 animate-pulse" />
            生成中...
          </div>
        ) : error ? (
          <div className="text-sm text-slate-500">
            <p className="mb-2">解説を生成できませんでした。</p>
            <button
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
