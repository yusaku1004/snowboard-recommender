"use client";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  sub?: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  // null は未選択
  value: T | null;
  onChange: (value: T) => void;
}

// 選択中のハイライトがスライドする切り替えボタン
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  const index = options.findIndex((o) => o.value === value);

  return (
    <div className="glass rounded-2xl p-1 relative flex" role="radiogroup" aria-label={label}>
      <div
        hidden={index < 0}
        className="absolute top-1 bottom-1 left-1 rounded-xl bg-gradient-to-b from-white/20 to-white/10 border border-white/20 shadow-[0_4px_16px_-4px_rgba(56,189,248,0.5)] transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${Math.max(0, index) * 100}%)`,
        }}
      />
      {options.map((opt) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer ${
            value === opt.value ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {opt.label}
          {opt.sub && (
            <span className={`block text-xs font-normal mt-0.5 ${value === opt.value ? "text-sky-200/80" : "text-slate-400"}`}>
              {opt.sub}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
