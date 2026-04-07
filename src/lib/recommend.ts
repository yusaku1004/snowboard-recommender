import { Board, UserInput, RecommendResult, GenderPreference } from "@/types";

// Brand popularity tiebreaker (higher = more popular)
const BRAND_POPULARITY: Record<string, number> = {
  "BURTON": 100,
  "SALOMON": 90,
  "K2": 75,
  "RIDE": 80,
  "CAPITA": 83,
  "JONES": 72,
  "NITRO": 82,
  "GNU": 79,
  "LIB TECH": 80,
  "YONEX": 85,
  "HEAD": 63,
  "YES.": 70,
  "ROSSIGNOL": 58,
  "ROME": 70,
  "ARBOR": 62,
  "BATALEON": 66,
  "NEVER SUMMER": 65,
  "NIDECKER": 63,
  "ROXY": 62,
  "GRAY": 60,
  "OGASAKA": 82,
  "NOVEMBER": 74,
  "FNTC": 70,
  "RICE28": 56,
  "ALLIAN": 70,
  "GENTEMSTICK": 55,
  "SCOOTER": 54,
  "SPREAD": 65,
  "MOSS": 62,
  "011 Artistic": 51,
  "GT Snowboards": 55,
  "WRX SB": 62,
  "LEVERAGE": 58,
  "FIELD EARTH": 50,
  "TJ Brand": 52,
  "DINOSAURS WILL DIE": 56,
  "UNITED SHAPES": 54,
  "DC Snowboarding": 60,
  "ThirtyTwo": 58,
  "HOLIDAY": 52,
  "CROOJA": 45,
  "PUBLIC": 48,
  "DEATH LABEL": 50,
  "KORUA": 50,
  "DRAKE": 48,
  "FANATIC": 47,
  "TORQREX": 46,
  "BC STREAM": 45,
  "ENDEAVOR": 44,
  "SIMS": 53,
  "SLASH": 42,
  "AMPLID": 40,
  "SEASON": 40,
  "SIGNAL": 50,
  "WESTON": 37,
  "ACADEMY": 35,
  "TELOS": 34,
  "UNIT": 33,
  "MARHAR": 30,
  "SANTA CRUZ": 30,
  "LOBSTER": 28,
  "ACC": 45,
  "DEVGRU": 42,
  "ELAN": 50,
  "FORUM": 52,
  "MOSS SNOWSTICK": 48,
  "PLUTONIUM": 40,
  "READYMADE": 38,
  "SABRINA": 44,
  "SECCA": 42,
};
import { cosineSimilarity, getWeights } from "./cosine";
import { calculateIdealSize, calculateRecommendedSize } from "./size";

function calculateSizeMismatchPenalty(
  availableLengths: number[],
  idealSize: number
): number {
  const minDiff = Math.min(...availableLengths.map((l) => Math.abs(l - idealSize)));
  // 10cm以内: ペナルティなし、10-20cm: 最大10pt、20cm超: 最大25pt
  if (minDiff <= 10) return 0;
  if (minDiff <= 20) return (minDiff - 10) * 1.0;
  return 10 + (minDiff - 20) * 1.5;
}

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

const SCORE_KEYS: (keyof Board["style_scores"])[] = [
  "ground_tricks", "park", "carving", "run_tricks", "powder",
];

function hasValidStyleScores(board: Board): boolean {
  if (!board.style_scores) return false;
  return SCORE_KEYS.every(
    (k) => typeof board.style_scores[k] === "number" && board.style_scores[k] >= 1
  );
}

const STYLE_KEYS_BOARD: (keyof Board["style_scores"])[] = [
  "ground_tricks", "park", "carving", "run_tricks", "powder",
];

function boardCosineSimilarity(a: Board["style_scores"], b: Board["style_scores"]): number {
  let dot = 0, normA = 0, normB = 0;
  for (const k of STYLE_KEYS_BOARD) {
    dot += a[k] * b[k];
    normA += a[k] * a[k];
    normB += b[k] * b[k];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function getSimilarBoards(
  referenceBoard: Board,
  allBoards: Board[],
  input: UserInput
): RecommendResult[] {
  const filtered = allBoards
    .filter(hasValidStyleScores)
    .filter((b) => !(b.brand === referenceBoard.brand && b.model === referenceBoard.model));

  const effectiveBudget = input.budget * (1 + input.budgetFlexibility / 100);

  const results: RecommendResult[] = filtered.map((board) => {
    const similarity = boardCosineSimilarity(referenceBoard.style_scores, board.style_scores);
    const estimatedPrice = estimateDiscountedPrice(board.price, board.year);
    const recommendedSize = calculateRecommendedSize(
      input.height, input.weight, input.style, board.available_lengths, input.gender
    );
    return {
      board,
      matchPercentage: Math.round(similarity * 1000) / 10,
      recommendedSize,
      overBudget: estimatedPrice > effectiveBudget,
      estimatedPrice,
    };
  });

  // Deduplicate by brand+model, keep highest similarity
  const seen = new Map<string, RecommendResult>();
  for (const r of results) {
    const key = `${r.board.brand}|${r.board.model}`;
    if (!seen.has(key) || r.matchPercentage > seen.get(key)!.matchPercentage) {
      seen.set(key, r);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 6);
}

export function getRecommendations(
  boards: Board[],
  input: UserInput
): RecommendResult[] {
  const filtered = filterByGender(boards.filter(hasValidStyleScores), input.gender);
  const weights = getWeights(input.style);

  const idealSize = calculateIdealSize(input.height, input.weight, input.style, input.gender);

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
    const sizePenalty = calculateSizeMismatchPenalty(board.available_lengths, idealSize);

    const matchPercentage = Math.max(
      0,
      Math.min(100, similarity * 100 + flexBonus - budgetPenalty - sizePenalty)
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
  return deduped.slice(0, 30);
}
