"use client";

interface SliderProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

export function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit = "",
  formatValue,
  onChange,
}: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;
  // Extend visual range by one step below min so that value=min appears
  // slightly right of the left edge (not as "empty/zero").
  // When min=0, the left edge correctly represents "none", so no offset.
  const visualMin = min > 0 ? min - step : min;
  const percent = ((value - visualMin) / (max - visualMin)) * 100;

  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-3">
        <div className="flex items-baseline gap-1.5">
          <label className="text-sm font-medium text-slate-300">{label}</label>
          {hint && <span className="text-[10px] text-slate-600">{hint}</span>}
        </div>
        <span className="text-xl font-bold text-sky-400 tabular-nums tracking-tight">
          {displayValue}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 text-xl font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
        >
          −
        </button>
        <div className="relative flex-1">
          {/* Filled track */}
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 pointer-events-none"
            style={{ width: `${percent}%` }}
          />
          <input
            type="range"
            min={visualMin}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
            className="w-full relative z-10"
          />
        </div>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 text-xl font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
        >
          ＋
        </button>
      </div>
      <div className="flex justify-between text-xs text-slate-600 mt-1.5 px-14">
        <span>{formatValue ? formatValue(min) : `${min}${unit}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${unit}`}</span>
      </div>
    </div>
  );
}
