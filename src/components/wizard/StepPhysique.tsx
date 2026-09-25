"use client";

import { useRef, useState } from "react";
import { BootSize, GenderPreference, SkillLevel } from "@/types";
import { Segmented } from "@/components/ui/Segmented";
import { MetricSlider } from "@/components/ui/MetricSlider";
import { StepFooter } from "@/components/ui/StepFooter";
import { calculateIdealSize } from "@/lib/size";

interface StepPhysiqueProps {
  height: number;
  weight: number;
  gender: GenderPreference;
  level: SkillLevel | null;
  onLevelChange: (v: SkillLevel) => void;
  bootSize: BootSize | undefined;
  onBootSizeChange: (v: BootSize | undefined) => void;
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

const LEVEL_OPTIONS: { value: SkillLevel; label: string; sub: string }[] = [
  { value: "beginner", label: "初心者", sub: "ターン練習中" },
  { value: "intermediate", label: "中級者", sub: "中斜面を連続ターン" },
  { value: "advanced", label: "上級者", sub: "どこでも自在" },
];

const BOOT_OPTIONS: { value: BootSize | "unknown"; label: string }[] = [
  { value: "unknown", label: "未定" },
  { value: "small", label: "〜26.5" },
  { value: "medium", label: "27〜27.5" },
  { value: "large", label: "28〜" },
];

// スタイル補正前の目安（スタイルはすべて中間値）
const NEUTRAL_STYLE = { ground_tricks: 3, park: 3, carving: 3, run_tricks: 3, powder: 3 };

export function StepPhysique({
  height,
  weight,
  gender,
  level,
  onLevelChange,
  bootSize,
  onBootSizeChange,
  onHeightChange,
  onWeightChange,
  onGenderChange,
  onNext,
}: StepPhysiqueProps) {
  const baseSize = Math.round(calculateIdealSize(height, weight, NEUTRAL_STYLE, level ?? "intermediate"));
  const [showLevelError, setShowLevelError] = useState(false);
  const levelRef = useRef<HTMLDivElement>(null);

  // レベルは必須。未選択なら先に進まず、選択欄へ誘導する
  const handleNext = () => {
    if (!level) {
      setShowLevelError(true);
      levelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">あなたについて教えてください</h2>
      <p className="text-slate-400 mb-6 text-sm [@media(max-height:720px)]:mb-3">ボードの長さと硬さを選ぶ基準になります</p>

      <div className="space-y-2 mb-3">
        <Segmented label="タイプ" options={GENDER_OPTIONS} value={gender} onChange={onGenderChange} />
        <div ref={levelRef} className={`rounded-2xl transition-shadow ${showLevelError && !level ? "ring-2 ring-amber-300/70" : ""}`}>
          <Segmented
            label="レベル"
            options={LEVEL_OPTIONS}
            value={level}
            onChange={(v) => { onLevelChange(v); setShowLevelError(false); }}
          />
        </div>
        {showLevelError && !level && (
          <p role="alert" className="text-xs text-amber-200 px-1">
            レベルを選んでください（ボードの硬さとサイズ選びに使います）
          </p>
        )}
      </div>

      <div className="space-y-3 mb-3">
        <MetricSlider label="身長" value={height} min={140} max={200} step={1} unit="cm" onChange={onHeightChange} />
        <MetricSlider label="体重" value={weight} min={30} max={120} step={1} unit="kg" onChange={onWeightChange} />
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5 px-1">
            ブーツサイズ（cm・任意）<span className="font-normal"> — 足が大きい方はワイドモデルの要否を案内します</span>
          </p>
          <Segmented
            label="ブーツサイズ"
            options={BOOT_OPTIONS}
            value={bootSize ?? "unknown"}
            onChange={(v) => onBootSizeChange(v === "unknown" ? undefined : v)}
          />
        </div>
      </div>

      {/* Live insight */}
      <div className="rounded-3xl p-4 mb-6 flex items-center gap-4 bg-gradient-to-r from-sky-500/15 via-cyan-400/10 to-violet-500/15 border border-sky-300/20">
        <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-sky-400/15 border border-sky-300/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="20" rx="3" />
            <path d="M9 8h6M9 16h6" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-sky-200/80">あなたの目安サイズ</p>
          <p className="text-white">
            <span className="text-2xl font-black tabular-nums tracking-tight">{baseSize}</span>
            <span className="text-sm font-semibold text-slate-300 ml-0.5">cm前後</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">次のステップのスタイルで微調整します</p>
        </div>
      </div>

      <StepFooter onNext={handleNext} />
    </div>
  );
}
