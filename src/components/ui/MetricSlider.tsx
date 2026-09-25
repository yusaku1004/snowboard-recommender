"use client";

import { useCallback, useState } from "react";
import { parseNumericInput, snapToStep } from "@/lib/numberInput";

interface MetricSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  prefix?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

// 大きな数値表示つきのスライダー（ガラスカード1枚分）
export function MetricSlider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  prefix = "",
  format = String,
  onChange,
}: MetricSliderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const percent = ((value - min) / (max - min)) * 100;

  const startEditing = () => {
    setDraft(String(value));
    setEditing(true);
  };
  // 編集開始時に1回だけフォーカスして全選択する（毎レンダーで呼ばれないよう安定した参照にする）
  const focusOnMount = useCallback((el: HTMLInputElement | null) => {
    el?.focus();
    el?.select();
  }, []);
  const commit = () => {
    const parsed = parseNumericInput(draft);
    if (parsed !== null) onChange(snapToStep(parsed, min, max, step));
    setEditing(false);
  };
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  const stepButton =
    "w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 text-slate-200 text-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation cursor-pointer";

  return (
    <div className="glass rounded-3xl px-5 pt-4 pb-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <div className="flex gap-2">
          <button type="button" onClick={decrement} disabled={value <= min} aria-label={`${label}を減らす`} className={stepButton}>
            −
          </button>
          <button type="button" onClick={increment} disabled={value >= max} aria-label={`${label}を増やす`} className={stepButton}>
            ＋
          </button>
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 -mt-1 mb-4">
        {prefix && <span className="text-2xl font-bold text-slate-300">{prefix}</span>}
        {editing ? (
          <input
            ref={focusOnMount}
            type="text"
            inputMode="numeric"
            enterKeyHint="done"
            value={draft}
            aria-label={`${label}を入力`}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-44 min-w-0 bg-white/[0.06] rounded-xl px-2 -mx-2 text-5xl font-black tracking-tight text-white tabular-nums outline-none ring-2 ring-sky-400/60"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            aria-label={`${label}を数値で入力（現在 ${prefix}${format(value)}${unit}）`}
            className="group inline-flex items-baseline gap-1.5 cursor-text rounded-xl -mx-1 px-1 hover:bg-white/[0.04] transition-colors"
          >
            <span className="text-5xl font-black tracking-tight text-white tabular-nums">{format(value)}</span>
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-300 transition-colors self-center" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
        )}
        {unit && <span className="text-base font-semibold text-slate-400">{unit}</span>}
      </div>
      <div className="relative">
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.5)] pointer-events-none"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          aria-valuetext={`${prefix}${format(value)}${unit}`}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full relative z-10"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-2 tabular-nums">
        <span>{prefix}{format(min)}{unit}</span>
        <span>{prefix}{format(max)}{unit}</span>
      </div>
    </div>
  );
}
