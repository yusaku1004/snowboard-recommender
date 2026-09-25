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
  startLabel?: string;
  endLabel?: string;
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
  startLabel,
  endLabel,
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
          <label className="text-sm font-semibold text-white">{label}</label>
          {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
        </div>
        <span className="text-xl font-black text-white tabular-nums tracking-tight">
          {displayValue}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          aria-label={`${label}を減らす`}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 text-slate-200 text-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation cursor-pointer"
        >
          −
        </button>
        <div className="relative flex-1">
          {/* Filled track */}
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.5)] pointer-events-none"
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
          aria-label={`${label}を増やす`}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 text-slate-200 text-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation cursor-pointer"
        >
          ＋
        </button>
      </div>
      <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 px-[3.25rem] tabular-nums">
        <span>{startLabel ?? (formatValue ? formatValue(min) : `${min}${unit}`)}</span>
        <span>{endLabel ?? (formatValue ? formatValue(max) : `${max}${unit}`)}</span>
      </div>
    </div>
  );
}
