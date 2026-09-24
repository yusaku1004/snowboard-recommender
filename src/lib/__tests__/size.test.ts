import { describe, expect, it } from "vitest";
import { calculateIdealSize, calculateRecommendedSize } from "../size";
import { makeStyle } from "./helpers";

describe("calculateIdealSize", () => {
  it("標準体重・スタイル補正なしなら 身長-15", () => {
    expect(calculateIdealSize(170, 63, makeStyle())).toBe(155);
  });

  it.each([
    [75, 157], // +12kg → +2
    [70, 156], // +7kg → +1
    [57, 154], // -6kg → -1
    [50, 153], // -13kg → -2
  ])("体重%ikgなら %icm", (weight, expected) => {
    expect(calculateIdealSize(170, weight, makeStyle())).toBe(expected);
  });

  it("グラトリ重視は短め", () => {
    expect(calculateIdealSize(170, 63, makeStyle({ ground_tricks: 4 }))).toBe(152);
    expect(calculateIdealSize(170, 63, makeStyle({ ground_tricks: 5 }))).toBe(151);
  });

  it("カービング・パウダー重視は長め", () => {
    expect(calculateIdealSize(170, 63, makeStyle({ carving: 4 }))).toBe(157);
    expect(calculateIdealSize(170, 63, makeStyle({ powder: 5 }))).toBe(158);
  });

  it("複数該当する場合は平均を取る", () => {
    expect(calculateIdealSize(170, 63, makeStyle({ ground_tricks: 4, carving: 5 }))).toBe(155);
  });
});

describe("calculateRecommendedSize", () => {
  it("理想サイズに最も近い長さを選ぶ", () => {
    expect(calculateRecommendedSize(170, 63, makeStyle(), [148, 154, 159])).toBe(154);
  });

  it("候補外でも最も近いものを返す", () => {
    expect(calculateRecommendedSize(170, 63, makeStyle(), [140, 142])).toBe(142);
  });

  it("候補が空なら理想サイズを丸めて返す", () => {
    expect(calculateRecommendedSize(170, 63, makeStyle(), [])).toBe(155);
  });
});
