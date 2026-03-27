import { StyleScores } from "@/types";

const STYLE_KEYS: (keyof StyleScores)[] = [
  "ground_tricks",
  "park",
  "carving",
  "run_tricks",
  "powder",
];

// User style scores are on 1-5 scale; board style_scores are on 1-10 scale.
// Scale user scores by 2x to normalize before cosine similarity calculation.
const USER_SCALE_FACTOR = 2;

export function cosineSimilarity(
  user: StyleScores,
  board: StyleScores,
  weights: number[]
): number {
  let dotProduct = 0;
  let normUser = 0;
  let normBoard = 0;

  for (let i = 0; i < STYLE_KEYS.length; i++) {
    const key = STYLE_KEYS[i];
    const w = weights[i];
    const u = user[key] * USER_SCALE_FACTOR * w;
    const b = board[key] * w;
    dotProduct += u * b;
    normUser += u * u;
    normBoard += b * b;
  }

  const denominator = Math.sqrt(normUser) * Math.sqrt(normBoard);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

// On 1-5 scale, ≥4 is equivalent to ≥7 on 1-10 scale (strong preference)
export function getWeights(userStyle: StyleScores): number[] {
  return STYLE_KEYS.map((key) => (userStyle[key] >= 4 ? 1.5 : 1.0));
}
