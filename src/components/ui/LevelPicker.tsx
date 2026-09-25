"use client";

interface LevelPickerProps {
  label: string;
  hint?: string;
  icon?: string;
  value: number; // 1-5
  onChange: (value: number) => void;
}

const LEVEL_LABELS = ["興味なし", "少し", "ふつう", "重視", "最重視"];

// 1〜5 をタップで選ぶ段階セレクター
export function LevelPicker({ label, hint, icon, value, onChange }: LevelPickerProps) {
  return (
    <div className="py-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-base leading-none">{icon}</span>}
          <span className="text-sm font-semibold text-white">{label}</span>
          {hint && <span className="text-[11px] text-slate-400 truncate">{hint}</span>}
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold ${value >= 4 ? "text-sky-300" : "text-slate-400"}`}>
          {LEVEL_LABELS[value - 1]}
        </span>
      </div>
      <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
        {LEVEL_LABELS.map((levelLabel, i) => {
          const level = i + 1;
          // 「興味なし」(1) はゲージを光らせず、選択中であることだけ枠線で示す
          const filled = value > 1 && level <= value;
          const noneSelected = value === 1 && level === 1;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={level === value}
              aria-label={`${label}: ${levelLabel}`}
              onClick={() => onChange(level)}
              className="group flex-1 h-9 flex items-center cursor-pointer touch-manipulation"
            >
              <span
                className={`block w-full h-2.5 rounded-full transition-all duration-300 group-active:scale-y-150 ${
                  filled
                    ? "bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.55)]"
                    : noneSelected
                      ? "bg-transparent ring-1 ring-slate-300/60"
                      : "bg-white/10 group-hover:bg-white/20"
                }`}
                style={filled ? { opacity: 0.55 + (level / 5) * 0.45 } : undefined}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
