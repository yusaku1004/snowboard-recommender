import { StyleScores, GenderPreference } from "@/types";

export function calculateIdealSize(
  height: number,
  weight: number,
  style: StyleScores,
  gender: GenderPreference = "all"
): number {
  let idealSize = gender === "womens" ? height - 20 : height - 15;

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

  return idealSize;
}

export function calculateRecommendedSize(
  height: number,
  weight: number,
  style: StyleScores,
  availableLengths: number[],
  gender: GenderPreference = "all"
): number {
  const idealSize = calculateIdealSize(height, weight, style, gender);

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
