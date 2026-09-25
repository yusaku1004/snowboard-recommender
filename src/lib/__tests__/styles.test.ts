import { describe, expect, it } from "vitest";
import { BEGINNER_STYLE, getStyleSummary } from "../styles";
import { makeStyle } from "./helpers";

describe("getStyleSummary", () => {
  it("初心者プリセット（まだ分からない）は「スタイル未定」", () => {
    expect(getStyleSummary(BEGINNER_STYLE)).toBe("スタイル未定");
  });

  it("4以上の項目が無ければ「バランス型」（一番高い項目があっても重視とは言わない）", () => {
    expect(getStyleSummary(makeStyle())).toBe("バランス型");
    expect(getStyleSummary(makeStyle({ carving: 3, park: 1 }))).toBe("バランス型");
  });

  it("最も高い項目を「〇〇重視」、同点2つなら併記", () => {
    expect(getStyleSummary(makeStyle({ ground_tricks: 5 }))).toBe("グラトリ重視");
    expect(getStyleSummary(makeStyle({ ground_tricks: 5, park: 5 }))).toBe("グラトリ・パーク重視");
  });

  it("3つ以上が同点で高ければ「オールラウンド重視」", () => {
    expect(getStyleSummary(makeStyle({ ground_tricks: 5, park: 5, carving: 5, run_tricks: 5, powder: 5 }))).toBe("オールラウンド重視");
  });
});
