"use client";

import { Button } from "./Button";

interface StepFooterProps {
  onNext: () => void;
  nextLabel?: string;
  onBack?: () => void;
  // 次へボタンの左に置く任意の補助ボタン（スキップなど）
  secondary?: { label: string; onClick: () => void };
}

// 画面下に固定されるステップ操作バー
export function StepFooter({ onNext, nextLabel = "次へ進む", onBack, secondary }: StepFooterProps) {
  return (
    <div className="sticky bottom-0 pt-6 safe-bottom bg-gradient-to-t from-[#060b18] via-[#060b18]/90 to-transparent -mx-4 px-4 z-20">
      <div className="flex gap-2.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="戻る"
            className="glass flex-shrink-0 w-14 rounded-2xl flex items-center justify-center text-slate-200 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        {secondary && (
          <button
            type="button"
            onClick={secondary.onClick}
            className="glass flex-shrink-0 px-5 rounded-2xl text-sm font-medium text-slate-300 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            {secondary.label}
          </button>
        )}
        <Button onClick={onNext} className="flex-1 py-4 text-base">
          {nextLabel}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
