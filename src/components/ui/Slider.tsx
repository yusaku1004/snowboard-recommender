"use client";

interface SliderProps {
  label: string;
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
  value,
  min,
  max,
  step,
  unit = "",
  formatValue,
  onChange,
}: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-lg font-bold text-sky-400">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>
          {formatValue ? formatValue(min) : `${min}${unit}`}
        </span>
        <span>
          {formatValue ? formatValue(max) : `${max}${unit}`}
        </span>
      </div>
    </div>
  );
}
