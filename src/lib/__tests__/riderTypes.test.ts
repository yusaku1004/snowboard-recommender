import { describe, expect, it } from "vitest";
import { RIDER_TYPES, getRiderType } from "../riderTypes";
import { BEGINNER_STYLE, STYLE_KEYS } from "../styles";
import { makeStyle } from "./helpers";

describe("getRiderType", () => {
  it("重視スタイルが1つなら、そのスタイルの単独タイプ", () => {
    expect(getRiderType(makeStyle({ ground_tricks: 5 }), "intermediate").id).toBe("ground-trick-artisan");
    expect(getRiderType(makeStyle({ powder: 4 }), "advanced").id).toBe("powder-hunter");
  });

  it("決まった組み合わせの2つを同じくらい重視していれば、組み合わせタイプ", () => {
    expect(getRiderType(makeStyle({ ground_tricks: 5, park: 5 }), "intermediate").id).toBe("freestyle-creator");
    expect(getRiderType(makeStyle({ run_tricks: 4, ground_tricks: 4 }), "intermediate").id).toBe("trickster");
    expect(getRiderType(makeStyle({ carving: 5, powder: 5 }), "advanced").id).toBe("freeride-explorer");
    expect(getRiderType(makeStyle({ carving: 4, run_tricks: 4 }), "advanced").id).toBe("speed-trickster");
  });

  it("2つに差があれば、高い方の単独タイプ", () => {
    expect(getRiderType(makeStyle({ ground_tricks: 5, run_tricks: 4 }), "intermediate").id).toBe("ground-trick-artisan");
    expect(getRiderType(makeStyle({ carving: 4, run_tricks: 5 }), "advanced").id).toBe("run-trick-artist");
  });

  it("STEP 2 のプリセットは、それぞれ名前どおりのタイプになる", () => {
    expect(getRiderType({ ground_tricks: 5, park: 1, carving: 2, run_tricks: 4, powder: 1 }, "intermediate").id).toBe("ground-trick-artisan");
    expect(getRiderType({ ground_tricks: 2, park: 5, carving: 2, run_tricks: 3, powder: 1 }, "intermediate").id).toBe("park-jumper");
    expect(getRiderType({ ground_tricks: 1, park: 1, carving: 5, run_tricks: 3, powder: 3 }, "intermediate").id).toBe("carving-seeker");
    expect(getRiderType({ ground_tricks: 1, park: 2, carving: 3, run_tricks: 3, powder: 5 }, "intermediate").id).toBe("powder-hunter");
    expect(getRiderType(makeStyle(), "intermediate").id).toBe("all-rounder");
  });

  it("組み合わせタイプが無い2つなら、値が大きい方の単独タイプ", () => {
    expect(getRiderType(makeStyle({ park: 4, powder: 5 }), "intermediate").id).toBe("powder-hunter");
  });

  it("重視スタイルが3つ以上ならオールマウンテン", () => {
    expect(getRiderType(makeStyle({ ground_tricks: 4, carving: 4, powder: 5 }), "advanced").id).toBe("all-mountain-master");
  });

  it("重視スタイルが無ければ、初心者はルーキー・それ以外はオールラウンダー", () => {
    expect(getRiderType(makeStyle(), "beginner").id).toBe("rookie");
    expect(getRiderType(makeStyle(), "intermediate").id).toBe("all-rounder");
    expect(getRiderType(BEGINNER_STYLE, "advanced").id).toBe("rookie");
  });

  it("すべての入力の組み合わせ（1〜5の5項目×レベル3）で必ずいずれかのタイプになり、12タイプすべてに到達できる", () => {
    const reached = new Set<string>();
    const levels = ["beginner", "intermediate", "advanced"] as const;
    const values = [1, 2, 3, 4, 5];
    for (const a of values) for (const b of values) for (const c of values) for (const d of values) for (const e of values)
      for (const level of levels) {
        const style = Object.fromEntries(STYLE_KEYS.map((k, i) => [k, [a, b, c, d, e][i]])) as unknown as ReturnType<typeof makeStyle>;
        reached.add(getRiderType(style, level).id);
      }
    expect(reached.size).toBe(RIDER_TYPES.length);
    expect(RIDER_TYPES).toHaveLength(12);
  });

  it("各タイプの代表入力は、そのタイプ自身に判定される", () => {
    for (const t of RIDER_TYPES) {
      expect(getRiderType(t.sample.style, t.sample.level).id).toBe(t.id);
    }
  });

  it("タイプIDは一意", () => {
    expect(new Set(RIDER_TYPES.map((t) => t.id)).size).toBe(RIDER_TYPES.length);
  });
});
