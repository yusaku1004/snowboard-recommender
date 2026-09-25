"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

interface DiagnoseCtaProps {
  // 計測用: どのページからの導線か
  from: string;
  title?: string;
  description?: string;
}

// 検索用ページから診断（トップ）へ誘導するカード
export function DiagnoseCta({
  from,
  title = "あなたに合う板とサイズを診断する",
  description = "身長・体重・レベル・滑りのスタイルを答えるだけ。約1分・無料・登録不要。",
}: DiagnoseCtaProps) {
  return (
    <div className="rounded-3xl p-5 my-8 bg-gradient-to-r from-sky-500/15 via-cyan-400/10 to-violet-500/15 border border-sky-300/25">
      <p className="text-base font-bold text-white mb-1">{title}</p>
      <p className="text-sm text-slate-300 mb-4">{description}</p>
      <Link
        href="/"
        onClick={() => trackEvent("diagnose_cta", { from })}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 text-white font-semibold shadow-[0_10px_30px_-8px_rgba(56,189,248,0.65)] hover:brightness-110 transition"
      >
        無料で診断する
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
