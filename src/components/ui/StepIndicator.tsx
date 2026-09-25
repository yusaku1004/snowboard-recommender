"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["基本情報", "スタイル", "予算", "こだわり", "結果"];

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const inputSteps = totalSteps - 1; // 結果ステップは除く
  const isResult = currentStep === inputSteps;

  if (isResult) return null;

  return (
    <div className="mb-7 [@media(max-height:720px)]:mb-4" aria-label={`ステップ ${currentStep + 1} / ${inputSteps}`}>
      <div className="flex items-baseline justify-between mb-2.5 px-0.5">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-sky-300/90">
          STEP {currentStep + 1}
          <span className="text-slate-400"> / {inputSteps}</span>
        </span>
        <span className="text-xs text-slate-400">{STEP_LABELS[currentStep]}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: inputSteps }, (_, i) => (
          <div key={i} className="relative h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.8)] transition-all duration-500 ease-out"
              style={{ width: i <= currentStep ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
