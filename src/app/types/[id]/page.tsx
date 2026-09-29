import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/pageMetadata";
import { SeoPage } from "@/components/seo/SeoPage";
import { BoardRow } from "@/components/seo/BoardRow";
import { DiagnoseCta } from "@/components/seo/DiagnoseCta";
import { RIDER_TYPES, getRiderTypeById } from "@/lib/riderTypes";
import { boardSlug, getBoardsForType } from "@/lib/seo";

type Params = { id: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return RIDER_TYPES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const type = getRiderTypeById((await params).id);
  if (!type) return {};
  return pageMetadata({
    title: `${type.name}タイプの特徴と相性のいいスノーボード | スノーボード診断`,
    description: `${type.tagline}。${type.description}`,
    path: `/types/${type.id}`,
    image: `/og?type=${type.id}`,
  });
}

export default async function RiderTypePage({ params }: { params: Promise<Params> }) {
  const type = getRiderTypeById((await params).id);
  if (!type) notFound();
  const [from, to] = type.colors;
  const boards = getBoardsForType(type);

  return (
    <SeoPage
      breadcrumbs={[
        { name: "スノーボーダータイプ", href: "/types" },
        { name: type.name, href: `/types/${type.id}` },
      ]}
    >
      <section
        className="relative overflow-hidden rounded-[28px] p-6 mb-6 border border-white/15"
        style={{ background: `linear-gradient(135deg, ${from}40, ${to}2e 60%, rgba(255,255,255,0.03))` }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mb-4 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          aria-hidden="true"
        >
          {type.emoji}
        </div>
        <p className="text-xs font-semibold tracking-[0.18em] text-white/80 mb-1">SNOWBOARDER TYPE</p>
        <h1 className="text-3xl font-black text-white leading-tight mb-1">{type.name}</h1>
        <p className="text-base text-white/90 mb-4">{type.tagline}</p>
        <p className="text-sm text-slate-100 leading-relaxed">{type.description}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-3">このタイプに合うボードの傾向</h2>
        <ul className="glass rounded-2xl p-4 space-y-2">
          {type.boardTips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-slate-200">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-2">
        <h2 className="text-lg font-bold text-white mb-1">{type.name}におすすめのボード</h2>
        <p className="text-xs text-slate-400 mb-3">身長170cm・標準体重の場合の例です。体格によっておすすめは変わります。</p>
        <ol className="space-y-2">
          {boards.map((r, i) => (
            <BoardRow key={boardSlug(r.board)} board={r.board} rank={i + 1} />
          ))}
        </ol>
      </section>

      <DiagnoseCta
        from={`type_${type.id}`}
        title="あなたのスノーボーダータイプは？"
        description="身長・体重・レベル・滑りのスタイルを答えるだけ。タイプと、あなたの体格に合う板・サイズがわかります。"
      />

      <section>
        <h2 className="text-lg font-bold text-white mb-3">ほかのタイプ</h2>
        <ul className="grid grid-cols-2 gap-2">
          {RIDER_TYPES.filter((t) => t.id !== type.id).map((t) => (
            <li key={t.id}>
              <Link href={`/types/${t.id}`} className="glass rounded-2xl p-3 flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
                <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
                <span className="text-sm font-medium text-slate-100 leading-tight">{t.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SeoPage>
  );
}
