"use client";

import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";

interface StepBudgetProps {
  budget: number;
  budgetFlexibility: number;
  onBudgetChange: (v: number) => void;
  onBudgetFlexibilityChange: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function formatYen(value: number): string {
  return `¥${value.toLocaleString()}`;
}

export function StepBudget({
  budget,
  budgetFlexibility,
  onBudgetChange,
  onBudgetFlexibilityChange,
  onNext,
  onBack,
}: StepBudgetProps) {
  const effectiveBudget = Math.round(budget * (1 + budgetFlexibility / 100));

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">予算を入力</h2>
      <p className="text-slate-400 text-center mb-8 text-sm">
        ボードの予算上限を設定してください
      </p>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 rounded-xl p-6 mb-6">
        <Slider
          label="予算上限"
          value={budget}
          min={3000}
          max={150000}
          step={5000}
          formatValue={formatYen}
          onChange={onBudgetChange}
        />
      </div>

      {/* 型落ち値引き説明パネル */}
      <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-sky-300 font-medium mb-1">
              型落ちモデルは推定価格を自動で割引します
            </p>
            <p className="text-xs text-slate-400">
              1年落ち → 約20%OFF / 2年落ち → 約35%OFF / 3年以上 → 約45%OFF
            </p>
          </div>
        </div>
      </div>

      {/* セール値引きへの期待度スライダー */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 rounded-xl p-6 mb-2">
        <Slider
          label="セール値引きへの期待度"
          value={budgetFlexibility}
          min={0}
          max={50}
          step={5}
          formatValue={(v) => `${v}%`}
          onChange={onBudgetFlexibilityChange}
        />
      </div>
      {budgetFlexibility > 0 && (
        <p className="text-xs text-slate-400 text-center mb-6">
          定価 {formatYen(effectiveBudget)} までのボードも検討します
        </p>
      )}
      {budgetFlexibility === 0 && <div className="mb-6" />}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={onNext}>診断する</Button>
      </div>
    </div>
  );
}
