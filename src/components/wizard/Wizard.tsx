"use client";

import { useState, useEffect, useCallback } from "react";
import { StyleScores, UserInput, GenderPreference, Shape, FlexCategory } from "@/types";
import { decodeInput } from "@/lib/share";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { StepPhysique } from "./StepPhysique";
import { StepStyle } from "./StepStyle";
import { StepBudget } from "./StepBudget";
import { StepBrands } from "./StepBrands";
import { StepResults } from "./StepResults";

const TOTAL_STEPS = 5;

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60);
  const [gender, setGender] = useState<GenderPreference>("all");
  const [style, setStyle] = useState<StyleScores>({
    ground_tricks: 1,
    park: 1,
    carving: 1,
    run_tricks: 1,
    powder: 1,
  });
  const [budget, setBudget] = useState(100000);
  const [budgetFlexibility, setBudgetFlexibility] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<Set<string> | null>(null);
  const [selectedShapes, setSelectedShapes] = useState<Set<Shape> | null>(null);
  const [selectedFlex, setSelectedFlex] = useState<Set<FlexCategory> | null>(null);
  const [restored, setRestored] = useState(false);

  // Restore from URL parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    if (!search) return;

    const input = decodeInput(search);
    if (!input) return;

    setHeight(input.height);
    setWeight(input.weight);
    setGender(input.gender);
    setStyle(input.style);
    setBudget(input.budget);
    setBudgetFlexibility(input.budgetFlexibility);
    setRestored(true);
  }, []);

  // Jump to results when restored from URL
  useEffect(() => {
    if (restored) {
      setCurrentStep(4);
      setRestored(false);
    }
  }, [restored]);

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

  const handleRestart = useCallback(() => {
    setDirection("backward");
    setCurrentStep(0);
    setHeight(170);
    setWeight(60);
    setGender("all");
    setStyle({
      ground_tricks: 1,
      park: 1,
      carving: 1,
      run_tricks: 1,
      powder: 1,
    });
    setBudget(100000);
    setBudgetFlexibility(0);
    setSelectedBrands(null);
    setSelectedShapes(null);
    setSelectedFlex(null);
    // Clear URL params
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const userInput: UserInput = {
    height,
    weight,
    gender,
    style,
    budget,
    budgetFlexibility,
  };

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
      <p className="text-slate-500 text-center mb-8 text-xs tracking-wide">
        あなたにぴったりの板を見つけよう
      </p>

      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="overflow-hidden">
        <div key={currentStep} className={animationClass}>
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
