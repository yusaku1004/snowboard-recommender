"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { StyleScores, UserInput, GenderPreference, SkillLevel, BootSize, Shape, FlexCategory, PriceRange } from "@/types";
import { FilterState } from "@/lib/share";
import { useLocalStorageItem, writeLocalStorage } from "@/hooks/useLocalStorage";
import { loadBoards } from "@/hooks/useBoards";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { StepPhysique } from "./StepPhysique";
import { StepStyle } from "./StepStyle";
import { StepBudget } from "./StepBudget";
import { StepBrands } from "./StepBrands";
import { StepResults } from "./StepResults";

const TOTAL_STEPS = 5;
const STORAGE_KEY = "snowboard_last_input_v1";

// ステップをブラウザ履歴に積み、端末の「戻る」操作でも前のステップに戻れるようにする。
// Next.js が history.state に内部情報を持つため、既存の state を保ったまま wizardStep を追加する。
function writeHistoryStep(step: number, mode: "push" | "replace", url?: string) {
  const state = { ...(window.history.state ?? {}), wizardStep: step };
  if (mode === "push") window.history.pushState(state, "", url);
  else window.history.replaceState(state, "", url);
}

function readHistoryStep(state: unknown): number | null {
  const step = (state as { wizardStep?: unknown } | null)?.wizardStep;
  return typeof step === "number" ? step : null;
}

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

function toUserInput(data: Partial<UserInput> | null | undefined): UserInput | null {
  if (!data || !data.height || !data.weight || !data.style || data.budget === undefined) return null;
  return {
    height: data.height,
    weight: data.weight,
    gender: data.gender ?? "all",
    level: data.level ?? "intermediate",
    style: data.style,
    budget: data.budget,
    budgetFlexibility: data.budgetFlexibility ?? 0,
    ...(data.bootSize ? { bootSize: data.bootSize } : {}),
  };
}

function parseSavedInput(raw: string | null): UserInput | null {
  if (!raw) return null;
  try {
    return toUserInput(JSON.parse(raw));
  } catch {
    return null;
  }
}

// ---- 入力途中の下書き（再読み込みしても入力が消えないようにする） ----
// sessionStorage に保存するので、同じタブ内の再読み込みでのみ復元され、タブを閉じると消える。
const DRAFT_KEY = "snowboard_draft_v1";

interface WizardDraft {
  step: number;
  input: UserInput;
  // レベルは必須の質問なので、まだ選んでいない状態（null）も保存する
  level: SkillLevel | null;
  filters: FilterState;
}

const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

interface StoredDraft {
  step: number;
  input: Omit<UserInput, "level"> & { level: SkillLevel | null };
  filters: { brands: string[] | null; shapes: Shape[] | null; flex: FlexCategory[] | null; priceRanges: PriceRange[] | null };
}

function saveDraft(draft: WizardDraft) {
  const toArray = <T,>(set: Set<T> | null) => (set ? Array.from(set) : null);
  const stored: StoredDraft = {
    step: draft.step,
    input: { ...draft.input, level: draft.level },
    filters: {
      brands: toArray(draft.filters.brands),
      shapes: toArray(draft.filters.shapes),
      flex: toArray(draft.filters.flex),
      priceRanges: toArray(draft.filters.priceRanges),
    },
  };
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(stored));
  } catch {}
}

function readDraft(): WizardDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredDraft;
    const input = toUserInput({ ...stored.input, level: stored.input.level ?? undefined });
    if (!input || typeof stored.step !== "number" || stored.step < 0 || stored.step >= TOTAL_STEPS) return null;
    const toSet = <T,>(arr: T[] | null | undefined) => (arr ? new Set(arr) : null);
    return {
      step: stored.step,
      input: { ...input, style: clampStyle(input.style) },
      level: LEVELS.includes(stored.input.level as SkillLevel) ? (stored.input.level as SkillLevel) : null,
      filters: {
        brands: toSet(stored.filters?.brands),
        shapes: toSet(stored.filters?.shapes),
        flex: toSet(stored.filters?.flex),
        priceRanges: toSet(stored.filters?.priceRanges),
      },
    };
  } catch {
    return null;
  }
}

// ページ読み込み時点の下書きを、モジュール読み込み時に1回だけ読んで固定する。
// 描画後はすぐに現在の入力で下書きが上書きされるため、それより前に読んでおく必要がある。
const initialDraft: WizardDraft | null = typeof window !== "undefined" ? readDraft() : null;
function getInitialDraft(): WizardDraft | null {
  return initialDraft;
}
const subscribeNoop = () => () => {};

interface WizardProps {
  // 共有URLから復元した入力（あれば結果画面から開始）
  initialInput?: UserInput | null;
  initialFilters?: FilterState | null;
  // AI解説APIが使えるか（APIキーが設定されているか）
  aiEnabled?: boolean;
}

export function Wizard({ initialInput = null, initialFilters = null, aiEnabled = false }: WizardProps) {
  // SSR / ハイドレーション時は null。クライアントで下書きがあれば key を変えて再マウントし、その値から始める
  const draft = useSyncExternalStore(subscribeNoop, getInitialDraft, () => null);
  const useDraft = initialInput === null && draft !== null;

  // 回答中にボードデータを先読みしておき、結果画面ですぐ表示できるようにする。
  // 最初の画面の読み込みと帯域を取り合わないよう、ブラウザが落ち着いてから開始する
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(loadBoards, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(loadBoards, 1500);
    return () => clearTimeout(id);
  }, []);

  return (
    <WizardInner
      key={useDraft ? "draft" : "fresh"}
      initialStep={useDraft ? draft.step : initialInput ? TOTAL_STEPS - 1 : 0}
      initialInput={useDraft ? draft.input : initialInput}
      initialFilters={useDraft ? draft.filters : initialFilters}
      initialLevel={useDraft ? draft.level : initialInput?.level ?? null}
      fromShare={!useDraft && initialInput !== null}
      aiEnabled={aiEnabled}
    />
  );
}

interface WizardInnerProps {
  initialStep: number;
  initialInput: UserInput | null;
  initialFilters: FilterState | null;
  initialLevel: SkillLevel | null;
  fromShare: boolean;
  aiEnabled: boolean;
}

function WizardInner({ initialStep, initialInput, initialFilters, initialLevel, fromShare, aiEnabled }: WizardInnerProps) {
  // 共有URLから開いた「他人の結果」を見ている状態。自分で診断を始めたら解除する
  const [isSharedView, setIsSharedView] = useState(fromShare);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [height, setHeight] = useState(initialInput?.height ?? 170);
  const [weight, setWeight] = useState(initialInput?.weight ?? 60);
  const [gender, setGender] = useState<GenderPreference>(initialInput?.gender ?? "all");
  // 初期値に流されて中級者のまま進まないよう、新規の診断では未選択から始める
  const [level, setLevel] = useState<SkillLevel | null>(initialLevel);
  const effectiveLevel: SkillLevel = level ?? "intermediate";
  const [bootSize, setBootSize] = useState<BootSize | undefined>(initialInput?.bootSize);
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
    if (currentStep !== TOTAL_STEPS - 1) return;
    writeLocalStorage(STORAGE_KEY, JSON.stringify({ height, weight, gender, level: effectiveLevel, style, budget, budgetFlexibility, bootSize }));
  }, [currentStep, height, weight, gender, effectiveLevel, style, budget, budgetFlexibility, bootSize]);

  // Keep an in-progress draft so a reload doesn't lose the user's answers
  useEffect(() => {
    saveDraft({
      step: currentStep,
      input: { height, weight, gender, level: effectiveLevel, style, budget, budgetFlexibility, bootSize },
      level,
      filters: { brands: selectedBrands, shapes: selectedShapes, flex: selectedFlex, priceRanges: selectedPriceRanges },
    });
  }, [currentStep, height, weight, gender, level, effectiveLevel, style, budget, budgetFlexibility, bootSize, selectedBrands, selectedShapes, selectedFlex, selectedPriceRanges]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const stepRef = useRef(currentStep);
  useEffect(() => {
    stepRef.current = currentStep;
  }, [currentStep]);

  // Record the initial step on the current history entry
  useEffect(() => {
    writeHistoryStep(stepRef.current, "replace");
  }, []);

  // Browser back / forward (including mobile swipe-back)
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const step = readHistoryStep(e.state);
      if (step === null) return;
      setDirection(step < stepRef.current ? "backward" : "forward");
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Analytics: step transition via browser history
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goToStep = useCallback((step: number) => {
    setDirection(step < stepRef.current ? "backward" : "forward");
    setCurrentStep(step);
    writeHistoryStep(step, "push");
    scrollToTop();
  }, [scrollToTop]);

  const goForward = useCallback(() => {
    goToStep(Math.min(stepRef.current + 1, TOTAL_STEPS - 1));
    // Analytics: step transition forward
  }, [goToStep]);

  const goBack = useCallback(() => {
    // 直前の履歴がこのウィザードのステップなら、ブラウザの戻ると同じ動きにする
    if (stepRef.current > 0 && readHistoryStep(window.history.state) === stepRef.current) {
      window.history.back();
    } else {
      setDirection("backward");
      setCurrentStep((s) => Math.max(s - 1, 0));
      scrollToTop();
    }
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
    setLevel(input.level);
    setBootSize(input.bootSize);
    setStyle(clampStyle(input.style));
    setBudget(input.budget);
    setBudgetFlexibility(input.budgetFlexibility);
    setSavedBannerDismissed(true);
  }, []);

  const handleRestoreAndShowResults = useCallback(() => {
    if (!savedInput) return;
    applyInput(savedInput);
    goToStep(TOTAL_STEPS - 1);
  }, [savedInput, applyInput, goToStep]);

  const handleRestoreAndContinue = useCallback(() => {
    if (!savedInput) return;
    applyInput(savedInput);
    setRestoreCount((c) => c + 1);
  }, [savedInput, applyInput]);

  const handleRestart = useCallback(() => {
    setIsSharedView(false);
    setDirection("backward");
    setCurrentStep(0);
    setHeight(170);
    setWeight(60);
    setGender("all");
    setLevel(null);
    setBootSize(undefined);
    setStyle(DEFAULT_STYLE);
    setBudget(100000);
    setBudgetFlexibility(0);
    setSelectedBrands(null);
    setSelectedShapes(null);
    setSelectedFlex(null);
    setSelectedPriceRanges(null);
    // Show the previous-session banner again
    setSavedBannerDismissed(false);
    // Clear URL params (keep the entry so history navigation still works)
    writeHistoryStep(0, "replace", window.location.pathname);
  }, []);

  const userInput = useMemo<UserInput>(
    () => ({ height, weight, gender, level: effectiveLevel, style, budget, budgetFlexibility, bootSize }),
    [height, weight, gender, effectiveLevel, style, budget, budgetFlexibility, bootSize]
  );

  const animationClass =
    direction === "forward" ? "slide-in-right" : "slide-in-left";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {currentStep === 0 ? (
        <header className="text-center pt-4 mb-8 [@media(max-height:720px)]:pt-0 [@media(max-height:720px)]:mb-4">
          {/* 背の低い画面（iPhone SE など）では見出しを詰め、最初の入力欄が見えるようにする */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full glass text-xs font-medium text-sky-200 [@media(max-height:720px)]:hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse" />
            無料・登録不要
          </div>
          <h1 className="text-[2.5rem] leading-[1.1] font-black tracking-tight text-white mb-3 [@media(max-height:720px)]:text-[1.75rem] [@media(max-height:720px)]:mb-1.5">
            あなたに<span className="text-gradient">ぴったり</span>の
            <br />
            一本を見つけよう
          </h1>
          <p className="text-slate-400 text-sm">
            85ブランド・1,000本以上から、あなたに合う板とサイズを診断
          </p>
          {!savedInput && (
            <div className="flex items-center justify-center gap-2 mt-5 [@media(max-height:720px)]:hidden">
              {["約1分", "4つの質問", "無料"].map((text) => (
                <span key={text} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 whitespace-nowrap">
                  {text}
                </span>
              ))}
            </div>
          )}
        </header>
      ) : (
        <header className="flex items-center justify-center gap-2 pt-1 mb-6">
          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 shadow-[0_0_14px_rgba(56,189,248,0.5)] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M5 19L19 5" />
            </svg>
          </span>
          <span className="text-sm font-bold tracking-tight text-white">スノーボード診断</span>
        </header>
      )}

      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Previous session banner */}
      {currentStep === 0 && savedInput && (
        <div className="mb-5 glass rounded-3xl p-4">
          <p className="text-sm font-semibold text-white mb-1">前回の診断データがあります</p>
          <p className="text-xs text-slate-400 mb-3">
            {savedInput.height}cm · {savedInput.weight}kg · ¥{savedInput.budget.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestoreAndShowResults}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white text-xs font-semibold shadow-[0_6px_20px_-8px_rgba(56,189,248,0.7)] hover:brightness-110 transition-all cursor-pointer"
            >
              前回の結果を見る
            </button>
            <button
              type="button"
              onClick={handleRestoreAndContinue}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-slate-200 border border-white/10 text-xs font-medium hover:bg-white/10 transition-all cursor-pointer"
            >
              設定を引き継いで再診断
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-clip">
        <div key={`${currentStep}-${restoreCount}`} className={animationClass}>
          {currentStep === 0 && (
            <StepPhysique
              height={height}
              weight={weight}
              gender={gender}
              level={level}
              onLevelChange={setLevel}
              bootSize={bootSize}
              onBootSizeChange={setBootSize}
              onHeightChange={setHeight}
              onWeightChange={setWeight}
              onGenderChange={setGender}
              onNext={goForward}
            />
          )}
          {currentStep === 1 && (
            <StepStyle
              style={style}
              level={effectiveLevel}
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
              sharedView={isSharedView}
              aiEnabled={aiEnabled}
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
