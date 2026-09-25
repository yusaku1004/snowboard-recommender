"use client";

import { Slider } from "@/components/ui/Slider";
import { MetricSlider } from "@/components/ui/MetricSlider";
import { StepFooter } from "@/components/ui/StepFooter";

interface StepBudgetProps {
  budget: number;
  budgetFlexibility: number;
  onBudgetChange: (v: number) => void;
  onBudgetFlexibilityChange: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const QUICK_BUDGETS = [60000, 80000, 100000, 150000];

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
      <h2 className="text-2xl font-bold text-white mb-1">予算はいくら？</h2>
      <p className="text-slate-400 mb-6 text-sm">予算を超えるボードも表示しますが、評価は下がります</p>

      <div className="mb-3">
        <MetricSlider
          label="予算上限"
          value={budget}
          min={50000}
          max={200000}
          step={5000}
          prefix="¥"
          format={(v) => v.toLocaleString()}
          onChange={onBudgetChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {QUICK_BUDGETS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onBudgetChange(amount)}
            aria-pressed={budget === amount}
            className={`py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              budget === amount
                ? "bg-sky-400/20 text-sky-200 border border-sky-300/40"
                : "glass text-slate-300 hover:bg-white/10"
            }`}
          >
            {amount / 10000}万円
          </button>
        ))}
      </div>

      {/* セール値引きへの期待度スライダー */}
      <div className="glass rounded-3xl px-5 pt-5 pb-1 mb-3">
        <Slider
          label="セール値引きへの期待度"
          value={budgetFlexibility}
          min={0}
          max={50}
          step={5}
          formatValue={(v) => `${v}%`}
          onChange={onBudgetFlexibilityChange}
        />
        {budgetFlexibility > 0 && (
          <p className="text-xs text-sky-200/80 -mt-2 mb-4">
            定価 {formatYen(effectiveBudget)} までのボードも検討します
          </p>
        )}
      </div>

      {/* 型落ち値引き説明パネル */}
      <div className="rounded-3xl p-4 mb-6 flex items-start gap-3 bg-gradient-to-r from-sky-500/10 to-violet-500/10 border border-sky-300/15">
        <div className="w-9 h-9 rounded-xl bg-sky-400/15 border border-sky-300/25 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-white font-medium mb-1">型落ちモデルは自動で割引して計算</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            現行 約10%OFF・1年落ち 約15%OFF・2年落ち 約30%OFF・3年以上 約40%OFF
          </p>
        </div>
      </div>

      <StepFooter onNext={onNext} onBack={onBack} />
    </div>
  );
}
