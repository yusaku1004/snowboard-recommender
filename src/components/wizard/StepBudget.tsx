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
      <h2 className="text-xl font-bold text-center mb-1 text-white">予算を入力</h2>
      <p className="text-slate-500 text-center mb-8 text-sm">
        ボードの予算上限を設定してください
      </p>

      <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 mb-6">
        <Slider
          label="予算上限"
          value={budget}
          min={30000}
          max={200000}
          step={5000}
          formatValue={formatYen}
          onChange={onBudgetChange}
        />
      </div>

      {/* 型落ち値引き説明パネル */}
      <div className="bg-sky-500/[0.06] border border-sky-500/15 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-sky-300 font-medium mb-1">
              型落ちモデルは推定価格を自動で割引します
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              現行 → 約10%OFF / 1年落ち → 約15%OFF / 2年落ち → 約30%OFF / 3年以上 → 約40%OFF
            </p>
          </div>
        </div>
      </div>

      {/* セール値引きへの期待度スライダー */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 mb-2">
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
      {budgetFlexibility > 0 ? (
        <p className="text-xs text-slate-500 text-center mb-6">
          定価 {formatYen(effectiveBudget)} までのボードも検討します
        </p>
      ) : (
        <div className="mb-6" />
      )}

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
