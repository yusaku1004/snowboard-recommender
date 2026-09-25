import { RecommendResult, UserInput } from "@/types";
import { applyFilters } from "./filters";
import { getRecommendations } from "./recommend";
import { ALL_BOARDS } from "./seo";
import { FilterState } from "./share";

// 共有URLの条件で診断した1位（OGP画像・メタデータ用。サーバー側でのみ使う）
export function getTopResult(input: UserInput, filters: FilterState | null): RecommendResult | null {
  const boards = filters ? applyFilters(ALL_BOARDS, filters) : ALL_BOARDS;
  return getRecommendations(boards, input)[0] ?? null;
}
