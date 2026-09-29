import Link from "next/link";
import { RiderType } from "@/lib/riderTypes";

interface RiderTypeCardProps {
  type: RiderType;
  // 共有URLで他人の結果を見ているとき
  shared?: boolean;
}

// 診断結果の「スノーボーダータイプ」カード
export function RiderTypeCard({ type, shared = false }: RiderTypeCardProps) {
  const [from, to] = type.colors;
  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-5 mb-4 border border-white/15"
      style={{ background: `linear-gradient(135deg, ${from}33, ${to}26 60%, rgba(255,255,255,0.03))` }}
    >
      <div
        className="absolute -right-10 -top-10 w-44 h-44 rounded-full blur-2xl opacity-40 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${from}, transparent 70%)` }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          aria-hidden="true"
        >
          {type.emoji}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-300">{shared ? "この人のスノーボーダータイプ" : "あなたのスノーボーダータイプ"}</p>
          <p className="text-2xl font-black text-white leading-tight">{type.name}</p>
          <p className="text-sm text-slate-200 mt-0.5">{type.tagline}</p>
        </div>
      </div>
      <p className="relative text-sm text-slate-200 leading-relaxed mt-4">{type.description}</p>
      <Link
        href={`/types/${type.id}`}
        className="relative inline-flex items-center gap-1 mt-3 text-sm font-medium text-white/90 hover:text-white underline-offset-2 hover:underline"
      >
        このタイプの特徴と合う板をもっと見る
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
