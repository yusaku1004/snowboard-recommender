import { describe, expect, it } from "vitest";
import { parseNumericInput, snapToStep } from "../numberInput";

describe("parseNumericInput", () => {
  it("半角・全角数字とカンマを読み取る", () => {
    expect(parseNumericInput("172")).toBe(172);
    expect(parseNumericInput("１７２")).toBe(172);
    expect(parseNumericInput("100,000")).toBe(100000);
    expect(parseNumericInput("¥85,000")).toBe(85000);
  });

  it("「万」表記に対応する", () => {
    expect(parseNumericInput("8万")).toBe(80000);
    expect(parseNumericInput("8.5万")).toBe(85000);
    expect(parseNumericInput("１２万円")).toBe(120000);
  });

  it("数値でなければ null", () => {
    expect(parseNumericInput("")).toBeNull();
    expect(parseNumericInput("abc")).toBeNull();
    expect(parseNumericInput("1-2")).toBeNull();
  });
});

describe("snapToStep", () => {
  it("範囲外は端に収める", () => {
    expect(snapToStep(250, 140, 200, 1)).toBe(200);
    expect(snapToStep(10, 30, 120, 1)).toBe(30);
  });

  it("ステップ単位に丸める", () => {
    expect(snapToStep(172.4, 140, 200, 1)).toBe(172);
    expect(snapToStep(83000, 50000, 200000, 5000)).toBe(85000);
    expect(snapToStep(82000, 50000, 200000, 5000)).toBe(80000);
  });
});
