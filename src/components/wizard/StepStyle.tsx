"use client";

import { SkillLevel, StyleScores } from "@/types";
import { LevelPicker } from "@/components/ui/LevelPicker";
import { StepFooter } from "@/components/ui/StepFooter";
import { RadarChart } from "@/components/results/LazyRadarChart";

interface StepStyleProps {
  style: StyleScores;
  level: SkillLevel;
  onStyleChange: (key: keyof StyleScores, value: number) => void;
  onPresetApply: (preset: StyleScores) => void;
  onNext: () => void;
  onBack: () => void;
}

const STYLE_ITEMS: { key: keyof StyleScores; label: string; description: string; icon: string }[] = [
  { key: "ground_tricks", label: "グラトリ", description: "地形を使わないトリック", icon: "🌀" },
  { key: "park", label: "パーク", description: "キッカー・ジブ・パイプ", icon: "🏂" },
  { key: "carving", label: "カービング", description: "エッジを効かせたターン", icon: "⛷️" },
  { key: "run_tricks", label: "ラントリ", description: "滑走しながらのトリック", icon: "💨" },
  { key: "powder", label: "パウダー", description: "新雪・深雪を滑走", icon: "❄️" },
];

// 始めたばかりで好みが決まっていない人向け（まずはターンの練習が中心）
const BEGINNER_PRESET: { label: string; icon: string; scores: StyleScores } = {
  label: "まだ分からない",
  icon: "🔰",
  scores: { ground_tricks: 2, park: 1, carving: 3, run_tricks: 2, powder: 2 },
};

const PRESETS: { label: string; icon: string; scores: StyleScores }[] = [
  { label: "グラトリ", icon: "🌀", scores: { ground_tricks: 5, park: 1, carving: 2, run_tricks: 4, powder: 1 } },
  { label: "パーク", icon: "🏂", scores: { ground_tricks: 2, park: 5, carving: 2, run_tricks: 3, powder: 1 } },
  { label: "カービング", icon: "⛷️", scores: { ground_tricks: 1, park: 1, carving: 5, run_tricks: 3, powder: 3 } },
  { label: "パウダー", icon: "❄️", scores: { ground_tricks: 1, park: 2, carving: 3, run_tricks: 3, powder: 5 } },
  { label: "オールラウンド", icon: "🏔️", scores: { ground_tricks: 3, park: 3, carving: 3, run_tricks: 3, powder: 3 } },
];

function isPresetActive(style: StyleScores, preset: StyleScores): boolean {
  return (Object.keys(preset) as (keyof StyleScores)[]).every((k) => style[k] === preset[k]);
}

export function StepStyle({ style, level, onStyleChange, onPresetApply, onNext, onBack }: StepStyleProps) {
  const isBeginner = level === "beginner";
  const presets = isBeginner ? [BEGINNER_PRESET, ...PRESETS] : [...PRESETS, BEGINNER_PRESET];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">どんな滑りが好き？</h2>
      <p className="text-slate-400 mb-5 text-sm">重視するスタイルほどゲージを多く選んでください</p>

      {isBeginner && (
        <div className="mb-4 rounded-2xl p-3.5 flex items-start gap-3 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-300/20">
          <span className="text-lg leading-none">🔰</span>
          <p className="text-xs text-slate-200 leading-relaxed">
            好みがまだ決まっていなければ「まだ分からない」を選べばOKです。結果画面の「条件を調整」からいつでも変えられます。
          </p>
        </div>
      )}

      {/* Presets */}
      <p className="text-[11px] font-semibold tracking-wider text-slate-400 mb-2">プリセット</p>
      <div className="flex gap-2 overflow-x-auto pt-1 pb-5 -mx-4 px-4 mb-0 [scrollbar-width:none]">
        {presets.map((preset) => {
          const active = isPresetActive(style, preset.scores);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onPresetApply(preset.scores)}
              aria-pressed={active}
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 w-[5.5rem] h-20 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                active
                  ? "bg-gradient-to-b from-sky-400/30 to-sky-500/10 text-white border border-sky-300/50 shadow-[0_8px_24px_-8px_rgba(56,189,248,0.7)]"
                  : "glass text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="text-2xl leading-none">{preset.icon}</span>
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="glass rounded-3xl px-5 py-1.5 mb-3 divide-y divide-white/[0.06]">
        {STYLE_ITEMS.map((item) => (
          <LevelPicker
            key={item.key}
            label={item.label}
            hint={item.description}
            icon={item.icon}
            value={style[item.key]}
            onChange={(v) => onStyleChange(item.key, v)}
          />
        ))}
      </div>

      <div className="glass rounded-3xl px-4 pt-4 pb-1 mb-6">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 text-center">あなたのスタイル</p>
        <RadarChart
          scores={{
            ground_tricks: style.ground_tricks * 2,
            park: style.park * 2,
            carving: style.carving * 2,
            run_tricks: style.run_tricks * 2,
            powder: style.powder * 2,
          }}
        />
      </div>

      <StepFooter onNext={onNext} onBack={onBack} />
    </div>
  );
}
