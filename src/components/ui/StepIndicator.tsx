"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["体格", "スタイル", "予算", "メーカー", "結果"];

function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div
              className={`transition-all duration-300 ${
                i === currentStep
                  ? "text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.7)] scale-125"
                  : i < currentStep
                    ? "text-sky-600"
                    : "text-slate-600"
              }`}
            >
              <SnowflakeIcon />
            </div>
            <span
              className={`text-xs mt-1 ${
                i === currentStep ? "text-sky-400" : "text-slate-500"
              }`}
            >
              {STEP_LABELS[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`w-8 h-0.5 mb-4 border-t-2 border-dashed ${
                i < currentStep ? "border-sky-600" : "border-slate-600"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
