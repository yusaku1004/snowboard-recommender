import { Board, UserInput, RecommendResult, GenderPreference } from "@/types";

// Brand popularity tiebreaker (higher = more popular)
const BRAND_POPULARITY: Record<string, number> = {
  "BURTON": 100,
  "SALOMON": 90,
  "K2": 88,
  "RIDE": 85,
  "CAPITA": 83,
  "JONES": 82,
  "GNU": 80,
  "LIB TECH": 80,
  "NITRO": 78,
  "YES.": 76,
  "YONEX": 75,
  "HEAD": 73,
  "ROSSIGNOL": 72,
  "ROME": 70,
  "ARBOR": 68,
  "BATALEON": 66,
  "NEVER SUMMER": 65,
  "NIDECKER": 63,
  "ROXY": 62,
  "GRAY": 60,
  "OGASAKA": 60,
  "NOVEMBER": 58,
  "FNTC": 57,
  "RICE28": 56,
  "ALLIAN": 55,
  "GENTEMSTICK": 55,
  "SCOOTER": 54,
  "SPREAD": 53,
  "MOSS": 52,
  "011 Artistic": 51,
  "GT Snowboards": 55,
  "DEATH LABEL": 50,
  "KORUA": 50,
  "DRAKE": 48,
  "FANATIC": 47,
  "TORQREX": 46,
  "BC STREAM": 45,
  "ENDEAVOR": 44,
  "SIMS": 43,
  "SLASH": 42,
  "AMPLID": 40,
  "SEASON": 40,
  "SIGNAL": 38,
  "WESTON": 37,
  "ACADEMY": 35,
  "TELOS": 34,
  "UNIT": 33,
  "MARHAR": 30,
  "SANTA CRUZ": 30,
  "LOBSTER": 28,
};
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
  // User style is on 1-5 scale; ≥4 means strong preference
  if (
    (userStyle.ground_tricks >= 4 || userStyle.park >= 4) &&
    flex >= 1 &&
    flex <= 4
  ) {
    return 5;
  }

  // Carving focused: stiff flex (7-10) is a bonus
  if (userStyle.carving >= 4 && flex >= 7 && flex <= 10) {
    return 5;
  }

  // Run tricks / Powder focused: medium flex (5-7) is a bonus
  if (
    (userStyle.run_tricks >= 4 || userStyle.powder >= 4) &&
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
  if (yearsOld <= 0) discount = 0.1;
  else if (yearsOld === 1) discount = 0.15;
  else if (yearsOld === 2) discount = 0.3;
  else discount = 0.4;

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

  // Deduplicate: keep only the best-scoring year per brand+model
  const seen = new Map<string, RecommendResult>();
  for (const r of results) {
    const key = `${r.board.brand}|${r.board.model}`;
    if (!seen.has(key) || r.matchPercentage > seen.get(key)!.matchPercentage) {
      seen.set(key, r);
    }
  }
  const deduped = Array.from(seen.values());

  deduped.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    const pa = BRAND_POPULARITY[a.board.brand] ?? 0;
    const pb = BRAND_POPULARITY[b.board.brand] ?? 0;
    return pb - pa;
  });
  return deduped.slice(0, 10);
}
