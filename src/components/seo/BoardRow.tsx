import Link from "next/link";
import { Board } from "@/types";
import { boardSlug, estimateDiscountedPrice } from "@/lib/seo";
import { SHAPE_LABELS, getFlexLabel } from "@/lib/glossary";

interface BoardRowProps {
  board: Board;
  rank?: number;
  // ランキングで表示する補足（マッチ度・スコアなど）
  note?: string;
}

// 検索用ページの一覧行（ボード個別ページへのリンク）
export function BoardRow({ board, rank, note }: BoardRowProps) {
  const estimated = estimateDiscountedPrice(board.price, board.year);
  return (
    <li>
      <Link
        href={`/boards/${boardSlug(board)}`}
        className="glass rounded-2xl p-3.5 flex items-center gap-3 hover:bg-white/[0.08] transition-colors"
      >
        {rank !== undefined && (
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm font-bold text-slate-200">
            {rank}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-400">{board.brand} · {board.year}</p>
          <p className="text-base font-bold text-white truncate">{board.model}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {SHAPE_LABELS[board.shape] ?? board.shape} ・ 硬さ {getFlexLabel(board.flex)}（{board.flex}/10）・ 想定 ¥{estimated.toLocaleString()}
          </p>
        </div>
        {note && <span className="flex-shrink-0 text-sm font-bold text-sky-200 tabular-nums">{note}</span>}
      </Link>
    </li>
  );
}
