import { Board, StyleScores, UserInput } from "@/types";
import { getFlexFit, FlexFit } from "./flex";
import { calculateIdealSize } from "./size";

const STYLE_LABELS: Record<keyof StyleScores, string> = {
  ground_tricks: "グラトリ",
  park: "パーク",
  carving: "カービング",
  run_tricks: "ラントリ",
  powder: "パウダー",
};

const FLEX_FIT_LABELS: Record<FlexFit, string> = {
  soft: "柔らかめで扱いやすい",
  stiff: "硬めで高速でも安定",
  medium: "ほどよい硬さ",
};

const MAX_REASONS = 3;

// おすすめ理由を短いタグ文言で返す（重要度順、最大3件）
export function getMatchReasons(
  board: Board,
  input: UserInput,
  recommendedSize: number,
  estimatedPrice: number
): string[] {
  const reasons: string[] = [];

  // 1. ユーザーが重視するスタイルに強い
  const focused = (Object.keys(input.style) as (keyof StyleScores)[])
    .filter((k) => input.style[k] >= 4)
    .sort((a, b) => input.style[b] - input.style[a]);
  const strongStyle = focused.find((k) => board.style_scores[k] >= 8);
  if (strongStyle) {
    reasons.push(`${STYLE_LABELS[strongStyle]}向き`);
  } else if (focused.length === 0 && Math.min(...Object.values(board.style_scores)) >= 5) {
    reasons.push("オールラウンドに使える");
  }

  // 2. 理想サイズにほぼ一致する長さがある
  const idealSize = calculateIdealSize(input.height, input.weight, input.style, input.level);
  if (Math.abs(recommendedSize - idealSize) <= 2) {
    reasons.push(`${recommendedSize}cmがぴったり`);
  }

  // 3. フレックスがスタイル・レベルに合う
  const flexFit = getFlexFit(board, input.style, input.level);
  if (input.level === "beginner" && board.flex <= 5) {
    reasons.push("初心者でも扱いやすい");
  } else if (flexFit) {
    reasons.push(FLEX_FIT_LABELS[flexFit]);
  }

  // 4. 予算内
  if (estimatedPrice <= input.budget) reasons.push("予算内");

  return reasons.slice(0, MAX_REASONS);
}
