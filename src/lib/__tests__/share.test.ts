import { describe, expect, it } from "vitest";
import { decodeFilters, decodeInput, encodeInput, getLineShareUrl, getTwitterShareUrl } from "../share";
import { makeInput, makeStyle } from "./helpers";

describe("encodeInput / decodeInput", () => {
  it("往復で同じ入力に戻る", () => {
    const input = makeInput({
      height: 182,
      weight: 74,
      gender: "mens",
      level: "beginner",
      bootSize: "large",
      style: makeStyle({ ground_tricks: 5, park: 1, carving: 4 }),
      budget: 85000,
      budgetFlexibility: 20,
    });
    expect(decodeInput(encodeInput(input))).toEqual(input);
  });

  it("レベルが無い古い共有URLは中級者として扱う", () => {
    expect(decodeInput("h=170&w=60&gt=3&pk=3&cv=3&rt=3&pw=3&b=100000")?.level).toBe("intermediate");
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

describe("getTwitterShareUrl", () => {
  it("絞り込み条件を共有URLに含める", () => {
    const tweet = new URL(getTwitterShareUrl(makeInput(), "BURTON Custom", {
      brands: new Set(["BURTON"]), shapes: null, flex: new Set(["soft"]), priceRanges: null,
    }));
    const shared = new URL(tweet.searchParams.get("url")!, "https://example.com");
    expect(shared.searchParams.get("brands")).toBe("BURTON");
    expect(shared.searchParams.get("flex")).toBe("soft");
    expect(tweet.searchParams.get("text")).toContain("BURTON Custom");
  });
});

describe("getLineShareUrl", () => {
  it("LINE の共有URLに診断条件と絞り込みを含む共有リンクを渡す", () => {
    const line = new URL(getLineShareUrl(makeInput({ height: 181 }), { brands: new Set(["K2"]), shapes: null, flex: null, priceRanges: null }));
    expect(line.origin + line.pathname).toBe("https://social-plugins.line.me/lineit/share");
    const shared = new URL(line.searchParams.get("url")!, "https://example.com");
    expect(shared.searchParams.get("h")).toBe("181");
    expect(shared.searchParams.get("brands")).toBe("K2");
  });
});
