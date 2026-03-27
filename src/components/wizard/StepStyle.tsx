"use client";

import { StyleScores } from "@/types";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";

interface StepStyleProps {
  style: StyleScores;
  onStyleChange: (key: keyof StyleScores, value: number) => void;
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

export function StepStyle({ style, onStyleChange, onNext, onBack }: StepStyleProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-center mb-1 text-white">スタイルを入力</h2>
      <p className="text-slate-500 text-center mb-8 text-sm">
        各スタイルの重視度を設定してください
      </p>

      <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 mb-6">
        {STYLE_ITEMS.map((item) => (
          <Slider
            key={item.key}
            label={item.label}
            hint={item.description}
            value={style[item.key]}
            min={1}
            max={10}
            step={1}
            onChange={(v) => onStyleChange(item.key, v)}
          />
        ))}
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
