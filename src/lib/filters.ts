import { Board, FlexCategory, PriceRange } from "@/types";
import { estimateDiscountedPrice } from "./recommend";
import { FilterState } from "./share";

const FLEX_RANGES: Record<FlexCategory, [number, number]> = {
  soft: [1, 3],
  mid: [4, 6],
  hard: [7, 10],
};

export function matchesFlex(flex: number, categories: Set<FlexCategory>): boolean {
  for (const cat of categories) {
    const [min, max] = FLEX_RANGES[cat];
    if (flex >= min && flex <= max) return true;
  }
  return false;
}

export function matchesPriceRange(estimatedPrice: number, ranges: Set<PriceRange>): boolean {
  if (ranges.has("under50") && estimatedPrice < 50000) return true;
  if (ranges.has("50to80") && estimatedPrice >= 50000 && estimatedPrice < 80000) return true;
  if (ranges.has("80to100") && estimatedPrice >= 80000 && estimatedPrice < 100000) return true;
  if (ranges.has("over100") && estimatedPrice >= 100000) return true;
  return false;
}

// 絞り込み条件を適用する（null はその条件で絞り込まない）
export function applyFilters(boards: Board[], filters: FilterState & { years?: Set<number> | null }): Board[] {
  let filtered = boards;
  if (filters.brands) filtered = filtered.filter((b) => filters.brands!.has(b.brand));
  if (filters.shapes) filtered = filtered.filter((b) => filters.shapes!.has(b.shape));
  if (filters.flex) filtered = filtered.filter((b) => matchesFlex(b.flex, filters.flex!));
  if (filters.priceRanges) {
    filtered = filtered.filter((b) => matchesPriceRange(estimateDiscountedPrice(b.price, b.year), filters.priceRanges!));
  }
  if (filters.years) filtered = filtered.filter((b) => filters.years!.has(b.year));
  return filtered;
}
