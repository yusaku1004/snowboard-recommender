import { describe, expect, it } from "vitest";
import { decodeFilters, decodeInput, encodeInput } from "../share";
import { makeInput, makeStyle } from "./helpers";

describe("encodeInput / decodeInput", () => {
  it("往復で同じ入力に戻る", () => {
    const input = makeInput({
      height: 182,
      weight: 74,
      gender: "mens",
      style: makeStyle({ ground_tricks: 5, park: 1, carving: 4 }),
      budget: 85000,
      budgetFlexibility: 20,
    });
    expect(decodeInput(encodeInput(input))).toEqual(input);
  });

  it("必須パラメータが欠けていれば null", () => {
    expect(decodeInput("h=170&w=60")).toBeNull();
    expect(decodeInput("")).toBeNull();
  });

  it("範囲外・不正な値はクランプする", () => {
    const decoded = decodeInput("h=300&w=abc&gt=9&pk=0&cv=3&rt=3&pw=3&b=10&g=xxx&bf=500");
    expect(decoded).toMatchObject({
      height: 200,
      weight: 30,
      gender: "all",
      style: { ground_tricks: 5, park: 1 },
      budget: 50000,
      budgetFlexibility: 100,
    });
  });
});

describe("decodeFilters", () => {
  it("指定がなければすべて null（全選択）", () => {
    expect(decodeFilters("h=170")).toEqual({ brands: null, shapes: null, flex: null, priceRanges: null });
  });

  it("不正な値を捨て、空になれば null にする", () => {
    const f = decodeFilters("brands=BURTON,K2&shapes=camber,bogus&flex=bogus&pr=under50");
    expect(f.brands).toEqual(new Set(["BURTON", "K2"]));
    expect(f.shapes).toEqual(new Set(["camber"]));
    expect(f.flex).toBeNull();
    expect(f.priceRanges).toEqual(new Set(["under50"]));
  });
});
