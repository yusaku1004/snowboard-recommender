import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoPage } from "@/components/seo/SeoPage";
import { BoardRow } from "@/components/seo/BoardRow";
import { DiagnoseCta } from "@/components/seo/DiagnoseCta";
import { RANKINGS, boardSlug, getRanking } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return RANKINGS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const ranking = getRanking(slug);
  if (!ranking) return {};
  const title = `${ranking.title}【2026年モデル】 | スノーボード診断`;
  return pageMetadata({ title, description: ranking.description, path: `/ranking/${slug}` });
}

export default async function RankingPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const ranking = getRanking(slug);
  if (!ranking) notFound();
  const results = ranking.compute();

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: ranking.title,
    itemListElement: results.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${r.board.brand} ${r.board.model}`,
      url: `${SITE_URL}/boards/${boardSlug(r.board)}`,
    })),
  };

  return (
    <SeoPage
      breadcrumbs={[
        { name: "おすすめランキング", href: "/ranking" },
        { name: ranking.heading, href: `/ranking/${slug}` },
      ]}
      jsonLd={[itemListLd]}
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-sky-300/90 mb-1">RANKING</p>
      <h1 className="text-3xl font-black text-white leading-tight mb-3">{ranking.title}</h1>
      <p className="text-sm text-slate-300 leading-relaxed mb-2">{ranking.description}</p>
      <p className="text-xs text-slate-400 mb-5">
        身長170cm・標準体重を基準に、スタイルの適性・硬さ・サイズ展開から算出しています。体格や好みによって最適なボードは変わります。
      </p>

      <ol className="space-y-2 mb-2">
        {results.map((r, i) => (
          <BoardRow key={boardSlug(r.board)} board={r.board} rank={i + 1} />
        ))}
      </ol>

      <DiagnoseCta from={`ranking_${slug}`} title="あなたの体格・スタイルで診断する" />

      <section>
        <h2 className="text-lg font-bold text-white mb-3">ほかのランキング</h2>
        <ul className="flex flex-wrap gap-2">
          {RANKINGS.filter((r) => r.slug !== slug).map((r) => (
            <li key={r.slug}>
              <Link href={`/ranking/${r.slug}`} className="inline-block px-3.5 py-2 rounded-full glass text-sm text-slate-200 hover:bg-white/10">
                {r.heading}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SeoPage>
  );
}
