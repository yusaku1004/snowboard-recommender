import { StyleScores, GenderPreference } from "@/types";

export function calculateRecommendedSize(
  height: number,
  weight: number,
  style: StyleScores,
  availableLengths: number[],
  gender: GenderPreference = "all"
): number {
  // Base size: height - 15 (womens: height - 20)
  let idealSize = height - 15;

  // Weight adjustment
  const standardWeight = (height - 100) * 0.9;
  const weightDiff = weight - standardWeight;
  if (weightDiff > 10) {
    idealSize += 2;
  } else if (weightDiff > 5) {
    idealSize += 1;
  } else if (weightDiff < -10) {
    idealSize -= 2;
  } else if (weightDiff < -5) {
    idealSize -= 1;
  }

  // Style adjustment
  const adjustments: number[] = [];

  // Gratri / Park preference -> shorter
  // User style is on 1-5 scale; ≥4 = strong, 5 = max
  if (style.ground_tricks >= 4) {
    adjustments.push(style.ground_tricks >= 5 ? -4 : -3);
  }

  // Carving / Powder preference -> longer
  if (style.carving >= 4 || style.powder >= 4) {
    const maxScore = Math.max(style.carving, style.powder);
    adjustments.push(maxScore >= 5 ? 3 : 2);
  }

  if (adjustments.length > 0) {
    const avgAdjustment =
      adjustments.reduce((a, b) => a + b, 0) / adjustments.length;
    idealSize += avgAdjustment;
  }

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
