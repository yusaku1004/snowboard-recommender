import { StyleScores, GenderPreference } from "@/types";

export function calculateRecommendedSize(
  height: number,
  weight: number,
  style: StyleScores,
  availableLengths: number[],
  gender: GenderPreference = "all"
): number {
  // Base size: height - 15 (womens: height - 20)
  let idealSize = gender === "womens" ? height - 20 : height - 15;

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
  if (style.ground_tricks >= 7 || style.park >= 7) {
    const maxScore = Math.max(style.ground_tricks, style.park);
    adjustments.push(maxScore >= 9 ? -3 : -2);
  }

  // Carving / Powder preference -> longer
  if (style.carving >= 7 || style.powder >= 7) {
    const maxScore = Math.max(style.carving, style.powder);
    adjustments.push(maxScore >= 9 ? 3 : 2);
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
