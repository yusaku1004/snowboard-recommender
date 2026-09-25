import { describe, expect, it } from "vitest";
import { applyFilters, matchesFlex, matchesPriceRange } from "../filters";
import { makeBoard } from "./helpers";

describe("applyFilters", () => {
  const boards = [
    makeBoard({ brand: "A", model: "soft", flex: 2, shape: "rocker" }),
    makeBoard({ brand: "B", model: "mid", flex: 5, shape: "camber" }),
    makeBoard({ brand: "A", model: "hard", flex: 8, shape: "camber" }),
  ];

  it("null の条件は絞り込まない", () => {
    expect(applyFilters(boards, { brands: null, shapes: null, flex: null, priceRanges: null })).toHaveLength(3);
  });

  it("複数条件は AND で絞り込む", () => {
    const result = applyFilters(boards, { brands: new Set(["A"]), shapes: new Set(["camber"]), flex: null, priceRanges: null });
    expect(result.map((b) => b.model)).toEqual(["hard"]);
  });

  it("空の集合は該当なし", () => {
    expect(applyFilters(boards, { brands: new Set(), shapes: null, flex: null, priceRanges: null })).toHaveLength(0);
  });
});

describe("matchesFlex / matchesPriceRange", () => {
  it("フレックスの区分（ソフト1〜3・ミドル4〜6・ハード7〜10）", () => {
    expect(matchesFlex(3, new Set(["soft"]))).toBe(true);
    expect(matchesFlex(4, new Set(["soft"]))).toBe(false);
    expect(matchesFlex(7, new Set(["mid", "hard"]))).toBe(true);
  });

  it("価格帯の境界", () => {
    expect(matchesPriceRange(49999, new Set(["under50"]))).toBe(true);
    expect(matchesPriceRange(50000, new Set(["under50"]))).toBe(false);
    expect(matchesPriceRange(100000, new Set(["over100"]))).toBe(true);
  });
});
