import boardsData from "@/data/boards_data.json";
import { Board, RecommendResult, SkillLevel, StyleScores, UserInput } from "@/types";
import { estimateDiscountedPrice, getRecommendations, getStyleRecommendations } from "./recommend";
import { calculateIdealSize, calculateRecommendedSize } from "./size";
import { BEGINNER_STYLE, STYLE_KEYS, STYLE_LABELS } from "./styles";

// 検索流入用の静的ページ（ボード個別・ランキング・サイズ目安）で使うデータ。
// サーバー側（ビルド時）でのみ使う。クライアントコンポーネントから import しないこと。

export const ALL_BOARDS = boardsData as Board[];

export function boardSlug(board: Pick<Board, "brand" | "model">): string {
  return `${board.brand} ${board.model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 同じ brand+model が複数年ある場合は新しい年式を採用
const BOARDS_BY_SLUG = new Map<string, Board>();
for (const board of ALL_BOARDS) {
  const slug = boardSlug(board);
  const existing = BOARDS_BY_SLUG.get(slug);
  if (!existing || board.year > existing.year) BOARDS_BY_SLUG.set(slug, board);
}

export function getBoardBySlug(slug: string): Board | undefined {
  return BOARDS_BY_SLUG.get(slug);
}

export function getAllBoardSlugs(): string[] {
  return Array.from(BOARDS_BY_SLUG.keys());
}

export function getBoardsByBrand(): { brand: string; boards: Board[] }[] {
  const map = new Map<string, Board[]>();
  for (const board of BOARDS_BY_SLUG.values()) {
    map.set(board.brand, [...(map.get(board.brand) ?? []), board]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([brand, boards]) => ({ brand, boards: boards.sort((a, b) => a.model.localeCompare(b.model)) }));
}

// ---- 標準的な体格・条件（ランキングやサイズ表の基準） ----
const NEUTRAL_STYLE: StyleScores = { ground_tricks: 3, park: 3, carving: 3, run_tricks: 3, powder: 3 };

export function standardWeight(height: number): number {
  return Math.round((height - 100) * 0.9);
}

function baseInput(overrides: Partial<UserInput> = {}): UserInput {
  return {
    height: 170,
    weight: standardWeight(170),
    gender: "all",
    level: "intermediate",
    style: NEUTRAL_STYLE,
    // ランキングでは予算による減点をしない
    budget: 200000,
    budgetFlexibility: 0,
    ...overrides,
  };
}

// ---- ボード個別ページ ----
export const SIZE_CHART_HEIGHTS = [150, 155, 160, 165, 170, 175, 180, 185, 190];

export function getBoardSizeChart(board: Board): { height: number; ideal: number; size: number; fits: boolean }[] {
  return SIZE_CHART_HEIGHTS.map((height) => {
    const weight = standardWeight(height);
    const ideal = Math.round(calculateIdealSize(height, weight, NEUTRAL_STYLE));
    const size = calculateRecommendedSize(height, weight, NEUTRAL_STYLE, board.available_lengths);
    return { height, ideal, size, fits: Math.abs(size - ideal) <= 5 };
  });
}

export function getSimilarBoardsForPage(board: Board, count = 6): Board[] {
  const norm = (s: StyleScores) => Math.sqrt(STYLE_KEYS.reduce((sum, k) => sum + s[k] * s[k], 0));
  const cos = (a: StyleScores, b: StyleScores) =>
    STYLE_KEYS.reduce((sum, k) => sum + a[k] * b[k], 0) / (norm(a) * norm(b) || 1);
  return Array.from(BOARDS_BY_SLUG.values())
    .filter((b) => boardSlug(b) !== boardSlug(board))
    .filter((b) => board.gender === "unisex" || b.gender === "unisex" || b.gender === board.gender)
    .map((b) => ({ b, score: cos(board.style_scores, b.style_scores) - Math.abs(b.flex - board.flex) * 0.01 }))
    .sort((x, y) => y.score - x.score)
    .slice(0, count)
    .map((x) => x.b);
}

// ボードの特徴を文章で説明する（得意スタイルから生成）
export function describeBoard(board: Board): string {
  const strong = STYLE_KEYS.filter((k) => board.style_scores[k] >= 8)
    .sort((a, b) => board.style_scores[b] - board.style_scores[a])
    .map((k) => STYLE_LABELS[k]);
  const flexText = board.flex <= 3 ? "柔らかめ" : board.flex <= 6 ? "ミドル" : "硬め";
  const styleText = strong.length > 0 ? `${strong.join("・")}が得意な` : "オールラウンドに使える";
  return `${board.brand} ${board.model}（${board.year}年モデル）は、${styleText}フレックス${board.flex}/10（${flexText}）のボードです。`;
}

export { estimateDiscountedPrice };

// ---- ランキングページ ----
export interface RankingDef {
  slug: string;
  title: string;
  heading: string;
  description: string;
  compute: () => RecommendResult[];
}

const RANKING_SIZE = 20;

export const RANKINGS: RankingDef[] = [
  ...STYLE_KEYS.map((style) => ({
    slug: style.replace("_", "-"),
    title: `${STYLE_LABELS[style]}向けスノーボードおすすめランキング`,
    heading: `${STYLE_LABELS[style]}向けのおすすめボード`,
    description: `${STYLE_LABELS[style]}に向いているスノーボードを、85ブランド・1,000本以上のデータからランキング。フレックスや形状、おすすめサイズもまとめて比較できます。`,
    compute: () => getStyleRecommendations(ALL_BOARDS, baseInput(), style).slice(0, RANKING_SIZE),
  })),
  {
    slug: "beginner",
    title: "初心者向けスノーボードおすすめランキング",
    heading: "初心者におすすめのボード",
    description:
      "これからスノーボードを始める人・ターンを練習中の人に向けて、扱いやすい柔らかめ〜ミドルフレックスのボードをランキング。",
    compute: () =>
      getRecommendations(ALL_BOARDS, baseInput({ level: "beginner" as SkillLevel, style: BEGINNER_STYLE })).slice(
        0,
        RANKING_SIZE
      ),
  },
  {
    slug: "under-50000",
    title: "5万円以下で買えるスノーボードおすすめランキング",
    heading: "5万円以下で買えるおすすめボード",
    description: "型落ち・セールを見込んだ想定価格が5万円以下のスノーボードから、オールラウンドに使えるボードをランキング。",
    compute: () =>
      getRecommendations(
        ALL_BOARDS.filter((b) => estimateDiscountedPrice(b.price, b.year) <= 50000),
        baseInput()
      ).slice(0, RANKING_SIZE),
  },
];

export function getRanking(slug: string): RankingDef | undefined {
  return RANKINGS.find((r) => r.slug === slug);
}

// ---- サイズ目安ページ ----
export const SIZE_PAGE_HEIGHTS = [145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195];

const SIZE_STYLES: { label: string; style: StyleScores }[] = [
  { label: "グラトリ・パーク重視", style: { ...NEUTRAL_STYLE, ground_tricks: 5, park: 4 } },
  { label: "オールラウンド", style: NEUTRAL_STYLE },
  { label: "カービング・パウダー重視", style: { ...NEUTRAL_STYLE, carving: 5, powder: 4 } },
];

export function getSizeTable(height: number) {
  const std = standardWeight(height);
  const weights = [
    { label: `軽め（${std - 10}kg）`, weight: std - 10 },
    { label: `標準（${std}kg）`, weight: std },
    { label: `重め（${std + 10}kg）`, weight: std + 10 },
  ];
  return {
    styles: SIZE_STYLES.map((s) => s.label),
    rows: weights.map((w) => ({
      label: w.label,
      sizes: SIZE_STYLES.map((s) => Math.round(calculateIdealSize(height, w.weight, s.style))),
    })),
    beginnerAdjustment: Math.round(calculateIdealSize(height, std, NEUTRAL_STYLE, "beginner") - calculateIdealSize(height, std, NEUTRAL_STYLE)),
  };
}
