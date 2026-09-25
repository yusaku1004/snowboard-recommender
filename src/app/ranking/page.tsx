import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { SeoPage } from "@/components/seo/SeoPage";
import { DiagnoseCta } from "@/components/seo/DiagnoseCta";
import { RANKINGS } from "@/lib/seo";

const title = "スノーボードおすすめランキング（スタイル別・初心者・予算別） | スノーボード診断";
const description =
  "グラトリ・パーク・カービング・ラントリ・パウダーのスタイル別、初心者向け、5万円以下など、目的別のスノーボードおすすめランキング。";

export const metadata: Metadata = pageMetadata({ title, description, path: "/ranking" });

export default function RankingIndexPage() {
  return (
    <SeoPage breadcrumbs={[{ name: "おすすめランキング", href: "/ranking" }]}>
      <h1 className="text-3xl font-black text-white leading-tight mb-3">スノーボードおすすめランキング</h1>
      <p className="text-sm text-slate-300 mb-5">目的に合わせて、85ブランド・1,000本以上から選んだランキングを見られます。</p>
      <ul className="space-y-2">
        {RANKINGS.map((r) => (
          <li key={r.slug}>
            <Link href={`/ranking/${r.slug}`} className="glass rounded-2xl p-4 block hover:bg-white/[0.08] transition-colors">
              <p className="text-base font-bold text-white">{r.heading}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <DiagnoseCta from="ranking_index" />
    </SeoPage>
  );
}
