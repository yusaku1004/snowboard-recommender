import { describe, expect, it } from "vitest";
import { cosineSimilarity, getWeights } from "../cosine";
import { makeStyle } from "./helpers";

describe("getWeights", () => {
  it("4以上の項目だけ重みを1.5倍にする", () => {
    expect(getWeights(makeStyle({ ground_tricks: 4, powder: 5 }))).toEqual([1.5, 1, 1, 1, 1.5]);
  });
});

describe("cosineSimilarity", () => {
  const flat = [1, 1, 1, 1, 1];

  it("ユーザー(1-5)を2倍したものと比例するボードは類似度1", () => {
    const user = makeStyle({ ground_tricks: 5, park: 4, carving: 1, run_tricks: 3, powder: 2 });
    const board = { ground_tricks: 10, park: 8, carving: 2, run_tricks: 6, powder: 4 };
    expect(cosineSimilarity(user, board, flat)).toBeCloseTo(1, 10);
  });

  it("傾向が逆のボードほど類似度が低い", () => {
    const user = makeStyle({ ground_tricks: 5, carving: 1 });
    const gratri = { ground_tricks: 10, park: 5, carving: 2, run_tricks: 5, powder: 5 };
    const carving = { ground_tricks: 2, park: 5, carving: 10, run_tricks: 5, powder: 5 };
    expect(cosineSimilarity(user, gratri, flat)).toBeGreaterThan(cosineSimilarity(user, carving, flat));
  });

  it("重み付けで重視項目の差が強調される", () => {
    const user = makeStyle({ ground_tricks: 5, carving: 1 });
    const board = { ground_tricks: 3, park: 5, carving: 5, run_tricks: 5, powder: 5 };
    expect(cosineSimilarity(user, board, getWeights(user))).toBeLessThan(
      cosineSimilarity(user, board, flat)
    );
  });
});
