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
      <h2 className="text-2xl font-bold text-center mb-2">スタイルを入力</h2>
      <p className="text-slate-400 text-center mb-8 text-sm">
        各スタイルの重視度を設定してください
      </p>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 rounded-xl p-6 mb-6">
        {STYLE_ITEMS.map((item) => (
          <div key={item.key}>
            <p className="text-xs text-slate-500 mb-1">{item.description}</p>
            <Slider
              label={item.label}
              value={style[item.key]}
              min={1}
              max={10}
              step={1}
              onChange={(v) => onStyleChange(item.key, v)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={onNext}>次へ</Button>
      </div>
    </div>
  );
}
