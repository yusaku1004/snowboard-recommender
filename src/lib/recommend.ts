import { Board, UserInput, RecommendResult, GenderPreference } from "@/types";
import { cosineSimilarity, getWeights } from "./cosine";
import { calculateRecommendedSize } from "./size";

function filterByGender(boards: Board[], preference: GenderPreference): Board[] {
  if (preference === "all") return boards;
  return boards.filter(
    (b) => b.gender === preference || b.gender === "unisex"
  );
}

function calculateFlexBonus(board: Board, userStyle: UserInput["style"]): number {
  const flex = board.flex;

  // Gratri / Park focused: soft flex (1-4) is a bonus
  if (
    (userStyle.ground_tricks >= 7 || userStyle.park >= 7) &&
    flex >= 1 &&
    flex <= 4
  ) {
    return 5;
  }

  // Carving focused: stiff flex (7-10) is a bonus
  if (userStyle.carving >= 7 && flex >= 7 && flex <= 10) {
    return 5;
  }

  // Run tricks / Powder focused: medium flex (5-7) is a bonus
  if (
    (userStyle.run_tricks >= 7 || userStyle.powder >= 7) &&
    flex >= 5 &&
    flex <= 7
  ) {
    return 5;
  }

  return 0;
}

export function estimateDiscountedPrice(price: number, year: number): number {
  const now = new Date();
  const currentSeasonYear =
    now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
  const yearsOld = currentSeasonYear - year;

  let discount = 0;
  if (yearsOld <= 0) discount = 0;
  else if (yearsOld === 1) discount = 0.2;
  else if (yearsOld === 2) discount = 0.35;
  else discount = 0.45;

  return Math.round(price * (1 - discount));
}

function calculateBudgetPenalty(
  estimatedPrice: number,
  budget: number,
  budgetFlexibility: number
): number {
  const effectiveBudget = budget * (1 + budgetFlexibility / 100);
  if (estimatedPrice <= effectiveBudget) return 0;
  const overAmount = estimatedPrice - effectiveBudget;
  const penalty = (overAmount / effectiveBudget) * 50;
  return Math.min(penalty, 30);
}

export function getRecommendations(
  boards: Board[],
  input: UserInput
): RecommendResult[] {
  const filtered = filterByGender(boards, input.gender);
  const weights = getWeights(input.style);

  const results: RecommendResult[] = filtered.map((board) => {
    const similarity = cosineSimilarity(input.style, board.style_scores, weights);
    const flexBonus = calculateFlexBonus(board, input.style);
    const estimatedPrice = estimateDiscountedPrice(board.price, board.year);
    const effectiveBudget = input.budget * (1 + input.budgetFlexibility / 100);
    const budgetPenalty = calculateBudgetPenalty(
      estimatedPrice,
      input.budget,
      input.budgetFlexibility
    );

    const matchPercentage = Math.max(
      0,
      Math.min(100, similarity * 100 + flexBonus - budgetPenalty)
    );

    const recommendedSize = calculateRecommendedSize(
      input.height,
      input.weight,
      input.style,
      board.available_lengths,
      input.gender
    );

    return {
      board,
      matchPercentage: Math.round(matchPercentage * 10) / 10,
      recommendedSize,
      overBudget: estimatedPrice > effectiveBudget,
      estimatedPrice,
    };
  });

  results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return results.slice(0, 10);
}
