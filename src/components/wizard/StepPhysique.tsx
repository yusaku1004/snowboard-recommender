"use client";

import { GenderPreference } from "@/types";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";

interface StepPhysiqueProps {
  height: number;
  weight: number;
  gender: GenderPreference;
  onHeightChange: (v: number) => void;
  onWeightChange: (v: number) => void;
  onGenderChange: (v: GenderPreference) => void;
  onNext: () => void;
}

const GENDER_OPTIONS: { value: GenderPreference; label: string }[] = [
  { value: "mens", label: "メンズ" },
  { value: "womens", label: "レディース" },
  { value: "all", label: "指定なし" },
];

export function StepPhysique({
  height,
  weight,
  gender,
  onHeightChange,
  onWeightChange,
  onGenderChange,
  onNext,
}: StepPhysiqueProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">体格を入力</h2>
      <p className="text-slate-400 text-center mb-8 text-sm">
        あなたの身長と体重を教えてください
      </p>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 rounded-xl p-6 mb-6">
        <div className="mb-6">
          <label className="block text-sm text-slate-300 mb-3">タイプ</label>
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onGenderChange(opt.value)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  gender === opt.value
                    ? "bg-sky-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Slider
          label="身長"
          value={height}
          min={140}
          max={200}
          step={1}
          unit="cm"
          onChange={onHeightChange}
        />
        <Slider
          label="体重"
          value={weight}
          min={30}
          max={120}
          step={1}
          unit="kg"
          onChange={onWeightChange}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>次へ</Button>
      </div>
    </div>
  );
}
