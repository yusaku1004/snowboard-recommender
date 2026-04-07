"use client";

import { StyleScores } from "@/types";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { RadarChart } from "@/components/results/RadarChart";

interface StepStyleProps {
  style: StyleScores;
  onStyleChange: (key: keyof StyleScores, value: number) => void;
  onPresetApply: (preset: StyleScores) => void;
  onNext: () => void;
  onBack: () => void;
}

const STYLE_ITEMS: { key: keyof StyleScores; label: string; description: string }[] = [
  { key: "ground_tricks", label: "グラトリ", description: "地形を使わないトリック" },
  { key: "park", label: "パーク", description: "キッカー・ジブ・ハーフパイプ" },
  { key: "carving", label: "カービング", description: "エッジを効かせたターン" },
  { key: "run_tricks", label: "ラントリ", description: "滑走しながらのトリック" },
  { key: "powder", label: "パウダー", description: "新雪・深雪を滑走" },
];

const PRESETS: { label: string; scores: StyleScores }[] = [
  { label: "グラトリ", scores: { ground_tricks: 5, park: 1, carving: 2, run_tricks: 4, powder: 1 } },
  { label: "パーク", scores: { ground_tricks: 2, park: 5, carving: 2, run_tricks: 3, powder: 1 } },
  { label: "カービング", scores: { ground_tricks: 1, park: 1, carving: 5, run_tricks: 3, powder: 3 } },
  { label: "パウダー", scores: { ground_tricks: 1, park: 2, carving: 3, run_tricks: 3, powder: 5 } },
  { label: "オールラウンド", scores: { ground_tricks: 3, park: 3, carving: 3, run_tricks: 3, powder: 3 } },
];

function isPresetActive(style: StyleScores, preset: StyleScores): boolean {
  return (Object.keys(preset) as (keyof StyleScores)[]).every((k) => style[k] === preset[k]);
}

export function StepStyle({ style, onStyleChange, onPresetApply, onNext, onBack }: StepStyleProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-center mb-1 text-white">スタイルを入力</h2>
      <p className="text-slate-500 text-center mb-6 text-sm">
        各スタイルの重視度を設定してください
      </p>

      {/* Presets */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2 font-medium">プリセットから選ぶ</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {PRESETS.map((preset) => {
            const active = isPresetActive(style, preset.scores);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onPresetApply(preset.scores)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-sky-500 text-white border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.4)]"
                    : "bg-slate-800/60 text-slate-400 border-slate-700/50 hover:border-sky-500/40 hover:text-sky-400"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 mb-4">
        {STYLE_ITEMS.map((item) => (
          <Slider
            key={item.key}
            label={item.label}
            hint={item.description}
            value={style[item.key]}
            min={1}
            max={5}
            step={1}
            startLabel="興味なし"
            endLabel="最重視"
            onChange={(v) => onStyleChange(item.key, v)}
          />
        ))}
      </div>

      <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl px-4 pt-3 pb-1 mb-6">
        <p className="text-xs text-slate-500 font-medium text-center mb-1">スタイルプレビュー</p>
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

      <div className="sticky bottom-0 pt-4 pb-2 safe-bottom bg-gradient-to-t from-[#0a1628] via-[#0a1628] to-transparent -mx-4 px-4">
        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            戻る
          </Button>
          <Button onClick={onNext}>次へ</Button>
        </div>
      </div>
    </div>
  );
}
