import { describe, expect, it } from "vitest";
import { matchesBrand } from "../brandSearch";

describe("matchesBrand", () => {
  it("英字は大文字小文字・空白を区別しない", () => {
    expect(matchesBrand("BURTON", "bur")).toBe(true);
    expect(matchesBrand("LIB TECH", "libtech")).toBe(true);
    expect(matchesBrand("YES.", "yes")).toBe(true);
  });

  it("カタカナ・ひらがな読みで検索できる", () => {
    expect(matchesBrand("BURTON", "バートン")).toBe(true);
    expect(matchesBrand("BURTON", "ばーとん")).toBe(true);
    expect(matchesBrand("OGASAKA", "おがさか")).toBe(true);
  });

  it("全角英字でも検索できる", () => {
    expect(matchesBrand("SALOMON", "ＳＡＬ")).toBe(true);
  });

  it("空の検索語はすべて一致、該当しなければ false", () => {
    expect(matchesBrand("BURTON", "  ")).toBe(true);
    expect(matchesBrand("BURTON", "サロモン")).toBe(false);
  });
});
