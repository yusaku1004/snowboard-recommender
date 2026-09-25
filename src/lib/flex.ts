import { Board, SkillLevel, UserInput } from "@/types";

export type FlexFit = "soft" | "stiff" | "medium";

// ユーザーの重視スタイル（4以上）に合うフレックスかどうか
export function getFlexFit(
  board: Board,
  userStyle: UserInput["style"],
  level: SkillLevel = "intermediate"
): FlexFit | null {
  const flex = board.flex;
  // Gratri / Park focused: soft flex (1-4)
  if ((userStyle.ground_tricks >= 4 || userStyle.park >= 4) && flex >= 1 && flex <= 4) return "soft";
  // Carving focused: stiff flex (7-10)。初心者に硬い板は扱いにくいため適合させない
  if (userStyle.carving >= 4 && level !== "beginner" && flex >= 7 && flex <= 10) return "stiff";
  // Run tricks / Powder focused: medium flex (5-7)。初心者のカービング重視もここに含める
  if (
    (userStyle.run_tricks >= 4 || userStyle.powder >= 4 || (userStyle.carving >= 4 && level === "beginner")) &&
    flex >= 5 &&
    flex <= 7
  ) {
    return "medium";
  }
  return null;
}

// レベルに対してフレックスが硬すぎる・柔らかすぎる場合の減点（マッチ度に加算、0以下）
export function getLevelFlexAdjustment(flex: number, level: SkillLevel): number {
  switch (level) {
    case "beginner":
      if (flex <= 6) return 0;
      if (flex <= 8) return -10;
      return -18;
    case "intermediate":
      return flex >= 9 ? -3 : 0;
    case "advanced":
      return flex <= 3 ? -3 : 0;
  }
}
