import { SkillLevel, StyleScores } from "@/types";

// 初心者は短め（取り回しやすさ・ターンのしやすさ優先）
const LEVEL_SIZE_ADJUSTMENT: Record<SkillLevel, number> = {
  beginner: -2,
  intermediate: 0,
  advanced: 0,
};

export function calculateIdealSize(
  height: number,
  weight: number,
  style: StyleScores,
  level: SkillLevel = "intermediate",
): number {
  let idealSize = height - 15;

  const standardWeight = (height - 100) * 0.9;
  const weightDiff = weight - standardWeight;
  if (weightDiff > 10) idealSize += 2;
  else if (weightDiff > 5) idealSize += 1;
  else if (weightDiff < -10) idealSize -= 2;
  else if (weightDiff < -5) idealSize -= 1;

  const adjustments: number[] = [];
  if (style.ground_tricks >= 4) adjustments.push(style.ground_tricks >= 5 ? -4 : -3);
  if (style.carving >= 4 || style.powder >= 4) {
    const maxScore = Math.max(style.carving, style.powder);
    adjustments.push(maxScore >= 5 ? 3 : 2);
  }
  if (adjustments.length > 0) {
    idealSize += adjustments.reduce((a, b) => a + b, 0) / adjustments.length;
  }

  return idealSize + LEVEL_SIZE_ADJUSTMENT[level];
}

export function calculateRecommendedSize(
  height: number,
  weight: number,
  style: StyleScores,
  availableLengths: number[],
  level: SkillLevel = "intermediate",
): number {
  const idealSize = calculateIdealSize(height, weight, style, level);

  if (availableLengths.length === 0) return Math.round(idealSize);

  // Find closest available length
  let closest = availableLengths[0];
  let minDiff = Math.abs(availableLengths[0] - idealSize);
  for (let i = 1; i < availableLengths.length; i++) {
    const diff = Math.abs(availableLengths[i] - idealSize);
    if (diff < minDiff) {
      minDiff = diff;
      closest = availableLengths[i];
    }
  }

  return closest;
}
