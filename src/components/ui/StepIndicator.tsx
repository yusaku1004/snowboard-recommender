"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["体格", "スタイル", "予算", "メーカー", "結果"];

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 px-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCurrent
                    ? "bg-sky-500 text-white shadow-[0_0_16px_rgba(56,189,248,0.5)] scale-110"
                    : isCompleted
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium transition-colors duration-300 ${
                  isCurrent
                    ? "text-sky-400"
                    : isCompleted
                      ? "text-sky-600"
                      : "text-slate-600"
                }`}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div className="relative w-8 h-0.5 mx-1 mb-5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-sky-500/60 rounded-full transition-all duration-500"
                  style={{ width: isCompleted ? "100%" : isCurrent ? "50%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
