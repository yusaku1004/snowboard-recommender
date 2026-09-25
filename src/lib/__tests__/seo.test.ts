import { describe, expect, it } from "vitest";
import {
  ALL_BOARDS,
  RANKINGS,
  boardSlug,
  getAllBoardSlugs,
  getBoardBySlug,
  getBoardSizeChart,
  getSimilarBoardsForPage,
  getSizeTable,
} from "../seo";

describe("boardSlug", () => {
  it("英数字以外をハイフンにし、小文字化する", () => {
    expect(boardSlug({ brand: "LIB TECH", model: "T.Rice Pro" })).toBe("lib-tech-t-rice-pro");
    expect(boardSlug({ brand: "YES.", model: "Standard" })).toBe("yes-standard");
    expect(boardSlug({ brand: "DEATH LABEL", model: "TRUST GIRLS×DAYZE" })).toBe("death-label-trust-girls-dayze");
  });

  it("実データの全ボードで一意かつ空でない", () => {
    const slugs = getAllBoardSlugs();
    expect(slugs.every((s) => s.length > 0)).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBeGreaterThan(1000);
  });

  it("スラッグからボードを引ける", () => {
    const board = ALL_BOARDS[0];
    expect(getBoardBySlug(boardSlug(board))?.model).toBe(board.model);
    expect(getBoardBySlug("no-such-board")).toBeUndefined();
  });
});

describe("ボード個別ページのデータ", () => {
  const board = ALL_BOARDS[0];

  it("身長別サイズ表は展開サイズの中から選ぶ", () => {
    const chart = getBoardSizeChart(board);
    expect(chart.length).toBeGreaterThan(5);
    expect(chart.every((row) => board.available_lengths.includes(row.size))).toBe(true);
  });

  it("似ているボードは自分自身を含まない", () => {
    const similar = getSimilarBoardsForPage(board);
    expect(similar).toHaveLength(6);
    expect(similar.some((b) => boardSlug(b) === boardSlug(board))).toBe(false);
  });
});

describe("ランキング", () => {
  it.each(RANKINGS.map((r) => [r.slug, r] as const))("%s は20件以内・重複なし", (_, ranking) => {
    const results = ranking.compute();
    expect(results.length).toBeGreaterThan(5);
    expect(results.length).toBeLessThanOrEqual(20);
    expect(new Set(results.map((r) => boardSlug(r.board))).size).toBe(results.length);
  });

  it("初心者ランキングに硬い板（flex 8以上）が入らない", () => {
    const results = RANKINGS.find((r) => r.slug === "beginner")!.compute();
    expect(results.every((r) => r.board.flex <= 7)).toBe(true);
  });
});

describe("サイズ目安表", () => {
  it("体重が重いほど・カービング重視ほど長くなる", () => {
    const table = getSizeTable(170);
    expect(table.rows[2].sizes[1]).toBeGreaterThan(table.rows[0].sizes[1]);
    expect(table.rows[1].sizes[2]).toBeGreaterThan(table.rows[1].sizes[0]);
    expect(table.beginnerAdjustment).toBe(-2);
  });
});
