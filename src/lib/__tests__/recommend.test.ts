import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  estimateDiscountedPrice,
  getRecommendations,
  getSimilarBoards,
  getStyleRecommendations,
  similarityToScore,
} from "../recommend";
import boardsData from "@/data/boards_data.json";
import { Board } from "@/types";
import { makeBoard, makeInput, makeStyle } from "./helpers";

beforeEach(() => {
  // 2026シーズン (2025年10月) に固定 → 2026年モデルは10%引き
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-10-01T00:00:00+09:00"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("estimateDiscountedPrice", () => {
  it.each([
    [2026, 90000], // 最新 10%引き
    [2025, 85000], // 1年落ち 15%引き
    [2024, 70000], // 2年落ち 30%引き
    [2020, 60000], // 3年以上 40%引き
  ])("%i年モデル → ¥%i", (year, expected) => {
    expect(estimateDiscountedPrice(100000, year)).toBe(expected);
  });
});

describe("getRecommendations", () => {
  const gratriInput = makeInput({ style: makeStyle({ ground_tricks: 5, carving: 1 }) });
  const gratriBoard = makeBoard({
    model: "GRATRI",
    style_scores: { ground_tricks: 10, park: 6, carving: 3, run_tricks: 6, powder: 5 },
  });
  const carvingBoard = makeBoard({
    model: "CARVING",
    style_scores: { ground_tricks: 2, park: 4, carving: 10, run_tricks: 5, powder: 6 },
  });

  it("スタイルが近いボードを上位にする", () => {
    const results = getRecommendations([carvingBoard, gratriBoard], gratriInput);
    expect(results.map((r) => r.board.model)).toEqual(["GRATRI", "CARVING"]);
  });

  it("性別フィルタ: mens 指定で womens を除外し unisex は残す", () => {
    const boards = [
      makeBoard({ model: "M", gender: "mens" }),
      makeBoard({ model: "W", gender: "womens" }),
      makeBoard({ model: "U", gender: "unisex" }),
    ];
    const models = getRecommendations(boards, makeInput({ gender: "mens" })).map((r) => r.board.model);
    expect(models.sort()).toEqual(["M", "U"]);
  });

  it("style_scores が欠けたボードは除外する", () => {
    const broken = makeBoard({
      model: "BROKEN",
      style_scores: { ground_tricks: 0, park: 5, carving: 5, run_tricks: 5, powder: 5 },
    });
    expect(getRecommendations([broken], makeInput())).toHaveLength(0);
  });

  it("予算オーバーは最大30%減点し overBudget を立てる", () => {
    const style = makeStyle({ ground_tricks: 5 });
    const scores = { ground_tricks: 10, park: 6, carving: 6, run_tricks: 6, powder: 6 };
    const cheap = makeBoard({ model: "CHEAP", price: 50000, style_scores: scores });
    const pricey = makeBoard({ model: "PRICEY", price: 300000, style_scores: scores });
    const [a, b] = getRecommendations([cheap, pricey], makeInput({ style }));
    expect(a.board.model).toBe("CHEAP");
    expect(a.overBudget).toBe(false);
    expect(b.overBudget).toBe(true);
    expect(a.matchPercentage - b.matchPercentage).toBeCloseTo(30, 1);
  });

  it("予算の許容幅 (budgetFlexibility) 内なら減点しない", () => {
    // 推定価格 ¥108,000 / 予算 ¥100,000 +10%
    const board = makeBoard({ price: 120000 });
    const [r] = getRecommendations([board], makeInput({ budgetFlexibility: 10 }));
    expect(r.overBudget).toBe(false);
  });

  it("グラトリ重視なら柔らかいボードに +5 のフレックスボーナス", () => {
    const scores = { ground_tricks: 8, park: 3, carving: 6, run_tricks: 3, powder: 7 };
    const soft = makeBoard({ model: "SOFT", flex: 3, style_scores: scores });
    const mid = makeBoard({ model: "MID", flex: 6, style_scores: scores });
    const [a, b] = getRecommendations([mid, soft], gratriInput);
    expect(a.board.model).toBe("SOFT");
    expect(a.matchPercentage - b.matchPercentage).toBeCloseTo(5, 1);
  });

  it("理想サイズから10cm超離れた長さしかないボードは大きく減点する", () => {
    const fits = makeBoard({ model: "FITS", available_lengths: [155] });
    const tooLong = makeBoard({ model: "LONG", available_lengths: [170] }); // 15cm差 → -7
    const [a, b] = getRecommendations([tooLong, fits], makeInput());
    expect(a.board.model).toBe("FITS");
    expect(a.matchPercentage - b.matchPercentage).toBeCloseTo(7, 1);
  });

  it("スタイルが同点なら理想サイズにより近い長さがあるボードを上位にする", () => {
    const exact = makeBoard({ model: "EXACT", available_lengths: [155] });
    const near = makeBoard({ model: "NEAR", available_lengths: [150] }); // 5cm差 → -1
    const [a, b] = getRecommendations([near, exact], makeInput());
    expect(a.board.model).toBe("EXACT");
    expect(a.matchPercentage - b.matchPercentage).toBeCloseTo(1, 1);
  });

  it("同じ brand+model は1件にまとめる", () => {
    const boards = [makeBoard({ year: 2025 }), makeBoard({ year: 2026 })];
    expect(getRecommendations(boards, makeInput())).toHaveLength(1);
  });

  it("マッチ度は 0〜100 に収まる", () => {
    const results = getRecommendations(
      [makeBoard({ price: 1000000, available_lengths: [120] })],
      makeInput()
    );
    expect(results[0].matchPercentage).toBeGreaterThanOrEqual(0);
    expect(results[0].matchPercentage).toBeLessThanOrEqual(100);
  });
});

describe("getStyleRecommendations", () => {
  it("性別フィルタが適用される", () => {
    const boards = [
      makeBoard({ model: "M", gender: "mens" }),
      makeBoard({ model: "W", gender: "womens" }),
      makeBoard({ model: "U", gender: "unisex" }),
    ];
    const models = getStyleRecommendations(boards, makeInput({ gender: "womens" }), "park").map(
      (r) => r.board.model
    );
    expect(models.sort()).toEqual(["U", "W"]);
  });

  it("指定スタイルのスコアが高い順に並ぶ", () => {
    const low = makeBoard({ model: "LOW", style_scores: { ground_tricks: 5, park: 3, carving: 5, run_tricks: 5, powder: 5 } });
    const high = makeBoard({ model: "HIGH", style_scores: { ground_tricks: 5, park: 9, carving: 5, run_tricks: 5, powder: 5 } });
    const models = getStyleRecommendations([low, high], makeInput(), "park").map((r) => r.board.model);
    expect(models).toEqual(["HIGH", "LOW"]);
  });

  it("予算内のボードをスコアより優先する", () => {
    const pricey = makeBoard({ model: "PRICEY", price: 300000, style_scores: { ground_tricks: 5, park: 10, carving: 5, run_tricks: 5, powder: 5 } });
    const cheap = makeBoard({ model: "CHEAP", price: 50000, style_scores: { ground_tricks: 5, park: 4, carving: 5, run_tricks: 5, powder: 5 } });
    const models = getStyleRecommendations([pricey, cheap], makeInput(), "park").map((r) => r.board.model);
    expect(models).toEqual(["CHEAP", "PRICEY"]);
  });

  it("同スコアならブランド優先度が高い方を上位にする", () => {
    const scores = { ground_tricks: 5, park: 8, carving: 5, run_tricks: 5, powder: 5 };
    const unknown = makeBoard({ brand: "UNKNOWN", style_scores: scores });
    const burton = makeBoard({ brand: "BURTON", style_scores: scores });
    const brands = getStyleRecommendations([unknown, burton], makeInput(), "park").map((r) => r.board.brand);
    expect(brands).toEqual(["BURTON", "UNKNOWN"]);
  });
});

describe("getSimilarBoards", () => {
  it("基準ボード自身を除外し、スコアが近い順に返す", () => {
    const ref = makeBoard({ model: "REF", style_scores: { ground_tricks: 10, park: 8, carving: 2, run_tricks: 7, powder: 3 } });
    const near = makeBoard({ model: "NEAR", style_scores: { ground_tricks: 9, park: 8, carving: 3, run_tricks: 7, powder: 3 } });
    const far = makeBoard({ model: "FAR", style_scores: { ground_tricks: 2, park: 3, carving: 10, run_tricks: 4, powder: 9 } });
    const models = getSimilarBoards(ref, [ref, far, near], makeInput()).map((r) => r.board.model);
    expect(models).toEqual(["NEAR", "FAR"]);
  });
});

describe("similarityToScore", () => {
  it("0.6以下は0、1.0は100、その間は線形", () => {
    expect(similarityToScore(0.5)).toBe(0);
    expect(similarityToScore(0.6)).toBe(0);
    expect(similarityToScore(0.8)).toBeCloseTo(50, 10);
    expect(similarityToScore(1)).toBe(100);
  });
});

describe("実データでのマッチ度の分布", () => {
  const profiles = {
    グラトリ: makeStyle({ ground_tricks: 5, park: 1, carving: 2, run_tricks: 4, powder: 1 }),
    パーク: makeStyle({ ground_tricks: 2, park: 5, carving: 2, run_tricks: 3, powder: 1 }),
    カービング: makeStyle({ ground_tricks: 1, park: 1, carving: 5, run_tricks: 3, powder: 3 }),
    パウダー: makeStyle({ ground_tricks: 1, park: 2, carving: 3, run_tricks: 3, powder: 5 }),
    オールラウンド: makeStyle(),
  };
  const levels = ["beginner", "intermediate", "advanced"] as const;

  for (const [name, style] of Object.entries(profiles)) for (const level of levels) it(`${name}重視・${level}でも上位が100%に張り付かず差がつく`, () => {
    const results = getRecommendations(boardsData as Board[], makeInput({ style, level }));
    const top10 = results.slice(0, 10);
    expect(results.filter((r) => r.matchPercentage >= 100)).toHaveLength(0);
    expect(new Set(top10.map((r) => r.matchPercentage)).size).toBeGreaterThanOrEqual(3);
    // 同点をブランド人気度で並べるだけの結果（特定ブランドの独占）になっていない
    expect(new Set(top10.map((r) => r.board.brand)).size).toBeGreaterThanOrEqual(4);
  });
});

describe("レベル別のおすすめ（実データ）", () => {
  const carving = makeStyle({ ground_tricks: 1, park: 1, carving: 5, run_tricks: 3, powder: 3 });

  it("カービング重視の初心者には、上位10件に硬い板（flex 8以上）を出さない", () => {
    const results = getRecommendations(boardsData as Board[], makeInput({ style: carving, level: "beginner" }));
    expect(results.slice(0, 10).every((r) => r.board.flex <= 7)).toBe(true);
  });

  it("カービング重視の上級者には硬い板が上位に来る", () => {
    const results = getRecommendations(boardsData as Board[], makeInput({ style: carving, level: "advanced" }));
    expect(results.slice(0, 10).filter((r) => r.board.flex >= 7).length).toBeGreaterThanOrEqual(5);
  });
});
