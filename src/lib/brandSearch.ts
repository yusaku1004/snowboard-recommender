// メーカー名の検索。英字表記に加えて、主要ブランドはカタカナ読みでも検索できるようにする。
const BRAND_READINGS: Record<string, string> = {
  "011 Artistic": "ゼロワンワンアーティスティック",
  ALLIAN: "アライアン",
  ARBOR: "アーバー",
  BATALEON: "バタレオン",
  "BC STREAM": "ビーシーストリーム",
  BURTON: "バートン",
  CAPITA: "キャピタ",
  CROOJA: "クロージャ",
  "DC Snowboarding": "ディーシー",
  "DEATH LABEL": "デスレーベル",
  ELAN: "エラン",
  FANATIC: "ファナティック",
  FNTC: "エフエヌティーシー",
  FORUM: "フォーラム",
  GENTEMSTICK: "ゲンテンスティック",
  GNU: "グヌー",
  GRAY: "グレイ",
  HEAD: "ヘッド",
  JONES: "ジョーンズ",
  K2: "ケーツー",
  KORUA: "コルア",
  "LIB TECH": "リブテック",
  MOSS: "モス",
  "MOSS SNOWSTICK": "モススノースティック",
  "NEVER SUMMER": "ネバーサマー",
  NIDECKER: "ナイデッカー",
  NITRO: "ナイトロ",
  NOVEMBER: "ノベンバー",
  OGASAKA: "オガサカ",
  RICE28: "ライス",
  RIDE: "ライド",
  ROME: "ローム",
  ROSSIGNOL: "ロシニョール",
  ROXY: "ロキシー",
  SALOMON: "サロモン",
  SCOOTER: "スクーター",
  SPREAD: "スプレッド",
  ThirtyTwo: "サーティーツー",
  "WRX SB": "ダブルアールエックス",
  "YES.": "イエス",
  YONEX: "ヨネックス",
};

// ひらがな→カタカナ、英字は小文字、空白・記号は無視
function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
    .replace(/[\s.・ー-]/g, "");
}

export function matchesBrand(brand: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return normalize(brand).includes(q) || normalize(BRAND_READINGS[brand] ?? "").includes(q);
}
