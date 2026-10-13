import baseBoards from "@/data/boards_data.json";
import carryoverBoards from "@/data/boards_carryover.json";
import offersFile from "@/data/rakuten_offers.json";
import waistsFile from "@/data/board_waists.json";
import { Board, RakutenOffer } from "@/types";
import { boardSlug } from "./slug";

// サイトで使うボードデータ（サーバー側でのみ使う）:
//   boards_data.json       手作業で管理する仕様データ
//   boards_carryover.json  前年仕様を引き継いで自動作成した新年式（scripts/update_rakuten.ts が生成）
//   rakuten_offers.json    楽天の実売価格・画像（同上。キーは "スラッグ|年式"）
//   board_waists.json      長さごとのウエスト幅（同上。楽天の商品説明から取得。キーはスラッグ）
export function offerKey(board: Pick<Board, "brand" | "model" | "year">): string {
  return `${boardSlug(board)}|${board.year}`;
}

const offers = (offersFile as { offers: Record<string, RakutenOffer> }).offers;

const waists = (waistsFile as { waists: Record<string, Record<string, number>> }).waists;

export const ALL_BOARDS: Board[] = [...(baseBoards as Board[]), ...(carryoverBoards as Board[])].map((board) => {
  const offer = offers[offerKey(board)];
  const waistWidths = waists[boardSlug(board)];
  return {
    ...board,
    ...(offer ? { offer } : {}),
    ...(waistWidths ? { waist_widths: waistWidths } : {}),
  };
});

// データに含まれる最新の年式（ページの見出しなどに使う）
export const LATEST_MODEL_YEAR = Math.max(...ALL_BOARDS.map((b) => b.year));
const OLDEST_MODEL_YEAR = Math.min(...ALL_BOARDS.map((b) => b.year));
// 例: "2026年モデル" / "2026〜2027年モデル"
export const MODEL_YEAR_LABEL =
  OLDEST_MODEL_YEAR === LATEST_MODEL_YEAR ? `${LATEST_MODEL_YEAR}年モデル` : `${OLDEST_MODEL_YEAR}〜${LATEST_MODEL_YEAR}年モデル`;
