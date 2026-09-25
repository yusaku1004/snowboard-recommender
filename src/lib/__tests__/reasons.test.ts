import { describe, expect, it } from "vitest";
import { getMatchReasons } from "../reasons";
import { makeBoard, makeInput, makeStyle } from "./helpers";

describe("getMatchReasons", () => {
  const gratriInput = makeInput({ style: makeStyle({ ground_tricks: 5, park: 4, carving: 1 }) });

  it("重視スタイルに強いボードは「〇〇向き」", () => {
    const board = makeBoard({ style_scores: { ground_tricks: 9, park: 6, carving: 3, run_tricks: 6, powder: 4 } });
    expect(getMatchReasons(board, gratriInput, 152, 200000)).toContain("グラトリ向き");
  });

  it("より重視度の高いスタイルを優先して表示する", () => {
    const board = makeBoard({ style_scores: { ground_tricks: 8, park: 9, carving: 3, run_tricks: 6, powder: 4 } });
    const reasons = getMatchReasons(board, gratriInput, 152, 200000);
    expect(reasons).toContain("グラトリ向き");
    expect(reasons).not.toContain("パーク向き");
  });

  it("重視スタイルがなく、全体的にスコアが高ければオールラウンド", () => {
    const board = makeBoard({ style_scores: { ground_tricks: 6, park: 6, carving: 6, run_tricks: 6, powder: 5 } });
    expect(getMatchReasons(board, makeInput(), 150, 200000)).toContain("オールラウンドに使える");
  });

  it("理想サイズ±2cm以内の長さがあれば「ぴったり」", () => {
    const board = makeBoard();
    // 170cm・標準体重・スタイル補正なし → 理想155cm
    expect(getMatchReasons(board, makeInput(), 155, 200000)).toContain("155cmがぴったり");
    expect(getMatchReasons(board, makeInput(), 150, 200000)).not.toContain("150cmがぴったり");
  });

  it("フレックスがスタイルに合えば理由に含める", () => {
    const soft = makeBoard({ flex: 3, style_scores: { ground_tricks: 5, park: 5, carving: 5, run_tricks: 5, powder: 5 } });
    expect(getMatchReasons(soft, gratriInput, 140, 200000)).toContain("柔らかめで扱いやすい");
  });

  it("予算内なら「予算内」", () => {
    const board = makeBoard({ style_scores: { ground_tricks: 5, park: 5, carving: 5, run_tricks: 5, powder: 5 } });
    expect(getMatchReasons(board, gratriInput, 140, 90000)).toEqual(["予算内"]);
    expect(getMatchReasons(board, gratriInput, 140, 100001)).toEqual([]);
  });

  it("最大3件まで", () => {
    const board = makeBoard({ flex: 3, style_scores: { ground_tricks: 9, park: 6, carving: 3, run_tricks: 6, powder: 4 } });
    // 170cm・63kg・グラトリ5 → 理想151cm
    const reasons = getMatchReasons(board, gratriInput, 151, 50000);
    expect(reasons).toEqual(["グラトリ向き", "151cmがぴったり", "柔らかめで扱いやすい"]);
  });
});
