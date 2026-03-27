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
  const percent = ((value - min) / (max - min)) * 100;

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
      <div className="relative">
        {/* Filled track */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 pointer-events-none"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full relative z-10"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600 mt-1.5">
        <span>{formatValue ? formatValue(min) : `${min}${unit}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${unit}`}</span>
      </div>
    </div>
  );
}
