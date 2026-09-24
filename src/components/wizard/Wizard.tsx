"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StyleScores, UserInput, GenderPreference, Shape, FlexCategory, PriceRange } from "@/types";
import { FilterState } from "@/lib/share";
import { useLocalStorageItem, writeLocalStorage } from "@/hooks/useLocalStorage";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { StepPhysique } from "./StepPhysique";
import { StepStyle } from "./StepStyle";
import { StepBudget } from "./StepBudget";
import { StepBrands } from "./StepBrands";
import { StepResults } from "./StepResults";

const TOTAL_STEPS = 5;
const STORAGE_KEY = "snowboard_last_input_v1";

function clampStyle(style: StyleScores): StyleScores {
  const keys = Object.keys(style) as (keyof StyleScores)[];
  const clamped = {} as StyleScores;
  for (const k of keys) {
    clamped[k] = Math.min(5, Math.max(1, style[k]));
  }
  return clamped;
}

const DEFAULT_STYLE: StyleScores = {
  ground_tricks: 3,
  park: 3,
  carving: 3,
  run_tricks: 3,
  powder: 3,
};

function parseSavedInput(raw: string | null): UserInput | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as UserInput;
    return data.height && data.weight && data.style && data.budget !== undefined ? data : null;
  } catch {
    return null;
  }
}

interface WizardProps {
  // 共有URLから復元した入力（あれば結果画面から開始）
  initialInput?: UserInput | null;
  initialFilters?: FilterState | null;
}

export function Wizard({ initialInput = null, initialFilters = null }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(initialInput ? 4 : 0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [height, setHeight] = useState(initialInput?.height ?? 170);
  const [weight, setWeight] = useState(initialInput?.weight ?? 60);
  const [gender, setGender] = useState<GenderPreference>(initialInput?.gender ?? "all");
  const [style, setStyle] = useState<StyleScores>(
    initialInput ? clampStyle(initialInput.style) : DEFAULT_STYLE
  );
  const [budget, setBudget] = useState(initialInput?.budget ?? 100000);
  const [budgetFlexibility, setBudgetFlexibility] = useState(initialInput?.budgetFlexibility ?? 0);
  const [selectedBrands, setSelectedBrands] = useState<Set<string> | null>(initialFilters?.brands ?? null);
  const [selectedShapes, setSelectedShapes] = useState<Set<Shape> | null>(initialFilters?.shapes ?? null);
  const [selectedFlex, setSelectedFlex] = useState<Set<FlexCategory> | null>(initialFilters?.flex ?? null);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<Set<PriceRange> | null>(
    initialFilters?.priceRanges ?? null
  );
  const [savedBannerDismissed, setSavedBannerDismissed] = useState(false);
  const [restoreCount, setRestoreCount] = useState(0);

  // Previous session from localStorage (null during SSR / hydration)
  const savedRaw = useLocalStorageItem(STORAGE_KEY);
  const savedInput = useMemo(
    () => (savedBannerDismissed ? null : parseSavedInput(savedRaw)),
    [savedRaw, savedBannerDismissed]
  );

  // Save to localStorage when user reaches results
  useEffect(() => {
    if (currentStep !== 4 || typeof window === "undefined") return;
    writeLocalStorage(STORAGE_KEY, JSON.stringify({ height, weight, gender, style, budget, budgetFlexibility }));
  }, [currentStep, height, weight, gender, style, budget, budgetFlexibility]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goForward = useCallback(() => {
    setDirection("forward");
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    scrollToTop();
    // Analytics: step transition forward
  }, [scrollToTop]);

  const goBack = useCallback(() => {
    setDirection("backward");
    setCurrentStep((s) => Math.max(s - 1, 0));
    scrollToTop();
    // Analytics: step transition backward
  }, [scrollToTop]);

  const handleStyleChange = useCallback((key: keyof StyleScores, value: number) => {
    setStyle((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePresetApply = useCallback((preset: StyleScores) => {
    setStyle(preset);
  }, []);

  const applyInput = useCallback((input: UserInput) => {
    setHeight(input.height);
    setWeight(input.weight);
    setGender(input.gender);
    setStyle(clampStyle(input.style));
    setBudget(input.budget);
    setBudgetFlexibility(input.budgetFlexibility);
    setSavedBannerDismissed(true);
  }, []);

  const handleRestoreAndShowResults = useCallback(() => {
    if (!savedInput) return;
    applyInput(savedInput);
    setDirection("forward");
    setCurrentStep(4);
    scrollToTop();
  }, [savedInput, applyInput, scrollToTop]);

  const handleRestoreAndContinue = useCallback(() => {
    if (!savedInput) return;
    applyInput(savedInput);
    setRestoreCount((c) => c + 1);
  }, [savedInput, applyInput]);

  const handleRestart = useCallback(() => {
    setDirection("backward");
    setCurrentStep(0);
    setHeight(170);
    setWeight(60);
    setGender("all");
    setStyle(DEFAULT_STYLE);
    setBudget(100000);
    setBudgetFlexibility(0);
    setSelectedBrands(null);
    setSelectedShapes(null);
    setSelectedFlex(null);
    setSelectedPriceRanges(null);
    // Show the previous-session banner again
    setSavedBannerDismissed(false);
    // Clear URL params
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const userInput = useMemo<UserInput>(
    () => ({ height, weight, gender, style, budget, budgetFlexibility }),
    [height, weight, gender, style, budget, budgetFlexibility]
  );

  const animationClass =
    direction === "forward" ? "slide-in-right" : "slide-in-left";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1
        className="hero-title text-3xl font-extrabold text-center mb-1.5 text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-sky-300 tracking-tight"
        data-text="スノーボード診断"
      >
        スノーボード診断
      </h1>
      <p className="text-slate-500 text-center mb-4 text-xs tracking-wide">
        85ブランド・1,000本以上からあなたにぴったりの板を見つけよう
      </p>

      {currentStep === 0 && !savedInput && (
        <div className="flex items-center justify-center gap-4 mb-6">
          {[
            { icon: "⏱", text: "約1分で完了" },
            { icon: "✅", text: "4つの質問に答えるだけ" },
            { icon: "🏂", text: "1,000本以上から診断" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}

      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Previous session banner */}
      {currentStep === 0 && savedInput && (
        <div className="mb-4 bg-sky-500/[0.07] border border-sky-500/20 rounded-2xl p-4">
          <p className="text-sm font-medium text-sky-300 mb-1">前回の診断データがあります</p>
          <p className="text-xs text-slate-500 mb-3">
            {savedInput.height}cm · {savedInput.weight}kg · ¥{savedInput.budget.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestoreAndShowResults}
              className="flex-1 py-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs font-medium hover:bg-sky-500/20 transition-all cursor-pointer"
            >
              前回の結果を見る
            </button>
            <button
              type="button"
              onClick={handleRestoreAndContinue}
              className="flex-1 py-2 rounded-xl bg-slate-800/60 text-slate-400 border border-slate-700/50 text-xs font-medium hover:bg-slate-700/60 transition-all cursor-pointer"
            >
              設定を引き継いで再診断
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden">
        <div key={`${currentStep}-${restoreCount}`} className={animationClass}>
          {currentStep === 0 && (
            <StepPhysique
              height={height}
              weight={weight}
              gender={gender}
              onHeightChange={setHeight}
              onWeightChange={setWeight}
              onGenderChange={setGender}
              onNext={goForward}
            />
          )}
          {currentStep === 1 && (
            <StepStyle
              style={style}
              onStyleChange={handleStyleChange}
              onPresetApply={handlePresetApply}
              onNext={goForward}
              onBack={goBack}
            />
          )}
          {currentStep === 2 && (
            <StepBudget
              budget={budget}
              budgetFlexibility={budgetFlexibility}
              onBudgetChange={setBudget}
              onBudgetFlexibilityChange={setBudgetFlexibility}
              onNext={goForward}
              onBack={goBack}
            />
          )}
          {currentStep === 3 && (
            <StepBrands
              selectedBrands={selectedBrands}
              selectedShapes={selectedShapes}
              selectedFlex={selectedFlex}
              onBrandsChange={setSelectedBrands}
              onShapesChange={setSelectedShapes}
              onFlexChange={setSelectedFlex}
              onNext={goForward}
              onBack={goBack}
            />
          )}
          {currentStep === 4 && (
            <StepResults
              input={userInput}
              onRestart={handleRestart}
              initialBrands={selectedBrands}
              initialShapes={selectedShapes}
              initialFlex={selectedFlex}
              initialPriceRanges={selectedPriceRanges}
            />
          )}
        </div>
      </div>
    </div>
  );
}
