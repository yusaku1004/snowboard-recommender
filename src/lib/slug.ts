// ボードの URL 用スラッグ（例: "LIB TECH" "T.Rice Pro" → "lib-tech-t-rice-pro"）
// scripts/ からも Node で直接読み込むため、他モジュールに依存しないこと。
export function boardSlug(board: { brand: string; model: string }): string {
  return `${board.brand} ${board.model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
