import { SkillLevel, StyleScores } from "@/types";
import { BEGINNER_STYLE, STYLE_KEYS } from "./styles";

// 診断結果に付ける「スノーボーダータイプ」。シェアしたくなる“自分を表す名前”として使う。
export interface RiderType {
  id: string;
  name: string;
  emoji: string;
  // ひとことで表すキャッチコピー
  tagline: string;
  description: string;
  // 合うボードの傾向
  boardTips: string[];
  // グラデーション（OGP画像・カードの配色）
  colors: [string, string];
  // タイプ紹介ページのおすすめボードを出すための代表的な入力
  sample: { style: StyleScores; level: SkillLevel };
}

const s = (gt: number, pk: number, cv: number, rt: number, pw: number): StyleScores => ({
  ground_tricks: gt,
  park: pk,
  carving: cv,
  run_tricks: rt,
  powder: pw,
});

export const RIDER_TYPES: RiderType[] = [
  {
    id: "ground-trick-artisan",
    name: "グラトリ職人",
    emoji: "🌀",
    tagline: "平らなバーンがあなたのステージ",
    description:
      "地形に頼らず、板一枚で回して・弾いて・乗りこなすタイプ。技の完成度を突き詰めるのが何より楽しいあなたには、プレスや回転がしやすい柔らかめの板が相棒です。",
    boardTips: ["柔らかめのフレックス（1〜4）", "ダブルキャンバーやロッカー系", "短めのサイズで取り回し重視"],
    colors: ["#22d3ee", "#6366f1"],
    sample: { style: s(5, 2, 2, 3, 1), level: "intermediate" },
  },
  {
    id: "park-jumper",
    name: "パーク・ジャンパー",
    emoji: "🏂",
    tagline: "キッカーとレールが遊び場",
    description:
      "キッカー、ジブ、パイプ。パークのアイテムを見ると入らずにはいられないタイプ。着地の安定感と弾きの強さを両立した、ツイン形状のフリースタイルボードが合います。",
    boardTips: ["ソフト〜ミドルのフレックス", "ツイン形状のフリースタイルボード", "やや短めのサイズ"],
    colors: ["#f472b6", "#8b5cf6"],
    sample: { style: s(2, 5, 2, 3, 1), level: "intermediate" },
  },
  {
    id: "carving-seeker",
    name: "カービング求道者",
    emoji: "🎯",
    tagline: "一本のラインに、すべてを懸ける",
    description:
      "エッジを立てて雪面を切り裂く、あの感覚がたまらないタイプ。スピードが上がってもブレない、張りのあるキャンバーの硬めの板でターンを極めましょう。",
    boardTips: ["硬めのフレックス（7〜10）", "キャンバー形状でエッジグリップ重視", "長めのサイズで高速安定"],
    colors: ["#38bdf8", "#1d4ed8"],
    sample: { style: s(1, 1, 5, 3, 3), level: "advanced" },
  },
  {
    id: "run-trick-artist",
    name: "ラントリ・アーティスト",
    emoji: "💨",
    tagline: "滑りそのものを表現に変える",
    description:
      "流れるように滑りながら、ノーリーやスピンを織り交ぜるタイプ。スピードと遊び心を両立できる、反発のあるミドルフレックスの板が表現の幅を広げてくれます。",
    boardTips: ["ミドルのフレックス（5〜7）", "ハイブリッドキャンバー系", "身長に合った標準サイズ"],
    colors: ["#34d399", "#0ea5e9"],
    sample: { style: s(3, 2, 3, 5, 2), level: "intermediate" },
  },
  {
    id: "powder-hunter",
    name: "パウダーハンター",
    emoji: "❄️",
    tagline: "新雪の朝は、誰よりも早く",
    description:
      "ノートラックの斜面に一番乗りしたいタイプ。雪に沈まず浮力を得られる、ノーズが長めのディレクショナル形状やロッカー系の板で、深雪を思いきり楽しみましょう。",
    boardTips: ["ミドル〜やや硬めのフレックス", "ロッカー系・セットバックの形状", "長めのサイズで浮力を確保"],
    colors: ["#e0f2fe", "#60a5fa"],
    sample: { style: s(1, 2, 3, 3, 5), level: "advanced" },
  },
  {
    id: "freestyle-creator",
    name: "フリースタイル・クリエイター",
    emoji: "🎨",
    tagline: "ゲレンデ全部をパークに変える",
    description:
      "平地でもパークでも、技を生み出すことに夢中なタイプ。どこでも回せて弾ける、軽くて柔らかめのフリースタイルボードが、あなたの発想をそのまま形にします。",
    boardTips: ["柔らかめのフレックス", "ツイン形状・ダブルキャンバー", "短め〜標準のサイズ"],
    colors: ["#fb7185", "#22d3ee"],
    sample: { style: s(5, 5, 2, 3, 1), level: "intermediate" },
  },
  {
    id: "trickster",
    name: "トリックスター",
    emoji: "🌪️",
    tagline: "止まっても、滑っても、魅せる",
    description:
      "グラトリもラントリもこなす、トリック全般の器用なタイプ。回しやすさと弾きのバランスが取れた、柔らかめ〜ミドルの板でレパートリーをどんどん増やしましょう。",
    boardTips: ["ソフト〜ミドルのフレックス", "ハイブリッドキャンバー・ダブルキャンバー", "やや短めのサイズ"],
    colors: ["#a78bfa", "#22d3ee"],
    sample: { style: s(5, 2, 2, 5, 1), level: "intermediate" },
  },
  {
    id: "freeride-explorer",
    name: "フリーライド・エクスプローラー",
    emoji: "🏔️",
    tagline: "山全体が自分のフィールド",
    description:
      "圧雪でも深雪でも、山の地形を丸ごと滑り尽くしたいタイプ。高速でも安定して、雪質を選ばないディレクショナル形状の硬めの板が頼れる相棒になります。",
    boardTips: ["ミドル〜硬めのフレックス", "ディレクショナル形状・キャンバー系", "長めのサイズ"],
    colors: ["#60a5fa", "#14b8a6"],
    sample: { style: s(1, 1, 5, 3, 5), level: "advanced" },
  },
  {
    id: "speed-trickster",
    name: "スピード・トリッカー",
    emoji: "⚡",
    tagline: "速さの中で技を決める",
    description:
      "攻めたカービングの流れの中で、ラントリを織り交ぜるタイプ。スピードに負けない張りと、弾きやすさを両立したミドル〜やや硬めの板が最高のパフォーマンスを引き出します。",
    boardTips: ["ミドル〜やや硬めのフレックス（5〜8）", "キャンバー・ハイブリッドキャンバー", "標準〜やや長めのサイズ"],
    colors: ["#facc15", "#f97316"],
    sample: { style: s(2, 1, 5, 5, 2), level: "advanced" },
  },
  {
    id: "all-mountain-master",
    name: "オールマウンテン・マスター",
    emoji: "👑",
    tagline: "どんな斜面も、どんな遊び方も",
    description:
      "トリックも、ターンも、パウダーも。スノーボードのあらゆる楽しみ方を欲張るタイプ。どの場面でもそつなくこなせる、バランスのいいミドルフレックスの板がおすすめです。",
    boardTips: ["ミドルのフレックス（4〜7）", "ハイブリッドキャンバー", "身長に合った標準サイズ"],
    colors: ["#fbbf24", "#a855f7"],
    sample: { style: s(4, 4, 4, 4, 4), level: "advanced" },
  },
  {
    id: "all-rounder",
    name: "ゲレンデ・オールラウンダー",
    emoji: "🗻",
    tagline: "気持ちよく滑れる日が、いちばんいい日",
    description:
      "特定のスタイルにこだわらず、その日の雪と気分でゲレンデを楽しむタイプ。扱いやすさと安定感を両立した、癖のないミドルフレックスの板が一番長く付き合えます。",
    boardTips: ["ミドルのフレックス", "ハイブリッドキャンバー・フラット", "身長に合った標準サイズ"],
    colors: ["#94a3b8", "#38bdf8"],
    sample: { style: s(3, 3, 3, 3, 3), level: "intermediate" },
  },
  {
    id: "rookie",
    name: "伸びしろ無限大ルーキー",
    emoji: "🔰",
    tagline: "今シーズンが、いちばん上手くなる",
    description:
      "これからどんどん上手くなるタイプ。まずは思い通りにターンできることが一番の近道です。柔らかめ〜ミドルで、エッジが引っかかりにくい扱いやすい板を選びましょう。",
    boardTips: ["柔らかめ〜ミドルのフレックス（3〜6）", "ロッカー系・フラット・ハイブリッド", "少し短めのサイズ"],
    colors: ["#86efac", "#22d3ee"],
    sample: { style: BEGINNER_STYLE, level: "beginner" },
  },
];

const byId = (id: string) => RIDER_TYPES.find((t) => t.id === id)!;

// 2つの重視スタイルの組み合わせ → タイプ
const PAIR_TYPES: Record<string, string> = {
  "ground_tricks+park": "freestyle-creator",
  "ground_tricks+run_tricks": "trickster",
  "carving+powder": "freeride-explorer",
  "carving+run_tricks": "speed-trickster",
};

const SINGLE_TYPES: Record<keyof StyleScores, string> = {
  ground_tricks: "ground-trick-artisan",
  park: "park-jumper",
  carving: "carving-seeker",
  run_tricks: "run-trick-artist",
  powder: "powder-hunter",
};

export function getRiderType(style: StyleScores, level: SkillLevel): RiderType {
  // 重視（4以上）のスタイルを、値の大きい順（同値は定義順）に並べる
  const focused = STYLE_KEYS.filter((k) => style[k] >= 4).sort((a, b) => style[b] - style[a]);

  if (focused.length === 0) {
    const isBeginnerPreset = STYLE_KEYS.every((k) => style[k] === BEGINNER_STYLE[k]);
    return byId(level === "beginner" || isBeginnerPreset ? "rookie" : "all-rounder");
  }
  if (focused.length >= 3) return byId("all-mountain-master");
  // 2つを同じくらい重視している（同じ値）ときだけ組み合わせタイプ。差があれば高い方の単独タイプ
  if (focused.length === 2 && style[focused[0]] === style[focused[1]]) {
    const key = [...focused].sort((a, b) => STYLE_KEYS.indexOf(a) - STYLE_KEYS.indexOf(b)).join("+");
    if (PAIR_TYPES[key]) return byId(PAIR_TYPES[key]);
  }
  return byId(SINGLE_TYPES[focused[0]]);
}

export function getRiderTypeById(id: string): RiderType | undefined {
  return RIDER_TYPES.find((t) => t.id === id);
}
