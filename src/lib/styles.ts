import { StyleScores } from "@/types";

// スタイルの表示名とアイコン（画面間で表記を揃えるため、ここを唯一の定義にする）
export const STYLE_KEYS: (keyof StyleScores)[] = ["ground_tricks", "park", "carving", "run_tricks", "powder"];

export const STYLE_LABELS: Record<keyof StyleScores, string> = {
  ground_tricks: "グラトリ",
  park: "パーク",
  carving: "カービング",
  run_tricks: "ラントリ",
  powder: "パウダー",
};

export const STYLE_ICONS: Record<keyof StyleScores, string> = {
  ground_tricks: "🌀",
  park: "🏂",
  carving: "⛷️",
  run_tricks: "💨",
  powder: "❄️",
};

// 始めたばかりで好みが決まっていない人向けのプリセット（まずはターンの練習が中心）
export const BEGINNER_STYLE: StyleScores = { ground_tricks: 2, park: 1, carving: 3, run_tricks: 2, powder: 2 };

// 結果画面の条件チップ用のスタイル要約（例: 「グラトリ重視」「グラトリ・パーク重視」「バランス型」）
export function getStyleSummary(style: StyleScores): string {
  if (STYLE_KEYS.every((k) => style[k] === BEGINNER_STYLE[k])) return "スタイル未定";
  const max = Math.max(...STYLE_KEYS.map((k) => style[k]));
  // 重視（4以上）の項目が無ければ特定のスタイルを重視しているとは言えない
  if (max < 4) return "バランス型";
  const top = STYLE_KEYS.filter((k) => style[k] === max);
  if (top.length > 2) return "オールラウンド重視";
  return `${top.map((k) => STYLE_LABELS[k]).join("・")}重視`;
}
