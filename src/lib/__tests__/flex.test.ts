import { describe, expect, it } from "vitest";
import { getFlexFit, getLevelFlexAdjustment } from "../flex";
import { makeBoard, makeStyle } from "./helpers";

describe("getFlexFit", () => {
  const carving = makeStyle({ carving: 5 });

  it("カービング重視の中級者以上には硬い板が適合", () => {
    expect(getFlexFit(makeBoard({ flex: 8 }), carving, "intermediate")).toBe("stiff");
    expect(getFlexFit(makeBoard({ flex: 8 }), carving, "advanced")).toBe("stiff");
  });

  it("カービング重視でも初心者には硬い板を適合させず、ミディアムを適合させる", () => {
    expect(getFlexFit(makeBoard({ flex: 8 }), carving, "beginner")).toBeNull();
    expect(getFlexFit(makeBoard({ flex: 6 }), carving, "beginner")).toBe("medium");
  });
});

describe("getLevelFlexAdjustment", () => {
  it("初心者は硬いほど大きく減点し、柔らかい〜ミドルは減点しない", () => {
    expect(getLevelFlexAdjustment(3, "beginner")).toBe(0);
    expect(getLevelFlexAdjustment(6, "beginner")).toBe(0);
    expect(getLevelFlexAdjustment(8, "beginner")).toBeLessThan(0);
    expect(getLevelFlexAdjustment(10, "beginner")).toBeLessThan(getLevelFlexAdjustment(8, "beginner"));
  });

  it("中級者は極端に硬い板だけ、上級者は極端に柔らかい板だけ軽く減点", () => {
    expect(getLevelFlexAdjustment(9, "intermediate")).toBeLessThan(0);
    expect(getLevelFlexAdjustment(7, "intermediate")).toBe(0);
    expect(getLevelFlexAdjustment(2, "advanced")).toBeLessThan(0);
    expect(getLevelFlexAdjustment(5, "advanced")).toBe(0);
  });
});
