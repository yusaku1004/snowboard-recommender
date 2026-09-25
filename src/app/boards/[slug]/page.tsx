import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { notFound } from "next/navigation";
import { SeoPage } from "@/components/seo/SeoPage";
import { BoardRow } from "@/components/seo/BoardRow";
import { DiagnoseCta } from "@/components/seo/DiagnoseCta";
import {
  boardSlug,
  describeBoard,
  estimateDiscountedPrice,
  getAllBoardSlugs,
  getBoardBySlug,
  getBoardSizeChart,
  getSimilarBoardsForPage,
} from "@/lib/seo";
import { FLEX_DESCRIPTIONS, SHAPE_DESCRIPTIONS, SHAPE_LABELS, getFlexCategory, getFlexLabel } from "@/lib/glossary";
import { STYLE_ICONS, STYLE_KEYS, STYLE_LABELS } from "@/lib/styles";
import { getAmazonSearchUrl, getRakutenSearchUrl, getYahooSearchUrl } from "@/lib/affiliate";
import { SITE_URL } from "@/lib/constants";

type Params = { slug: string };

const GENDER_LABELS: Record<string, string> = { mens: "メンズ", womens: "レディース", unisex: "ユニセックス" };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllBoardSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const board = getBoardBySlug(slug);
  if (!board) return {};
  const title = `${board.brand} ${board.model}（${board.year}）のサイズ・特徴・価格 | スノーボード診断`;
  const description = `${describeBoard(board)}身長別のおすすめサイズ、スタイル別の適性、似ているボードをまとめています。`;
  return pageMetadata({ title, description, path: `/boards/${slug}`, image: `/og?board=${slug}` });
}

export default async function BoardPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const board = getBoardBySlug(slug);
  if (!board) notFound();

  const estimated = estimateDiscountedPrice(board.price, board.year);
  const sizeChart = getBoardSizeChart(board);
  const similar = getSimilarBoardsForPage(board);
  const flexCategory = getFlexCategory(board.flex);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${board.brand} ${board.model}`,
    brand: { "@type": "Brand", name: board.brand },
    category: "スノーボード",
    description: describeBoard(board),
    url: `${SITE_URL}/boards/${slug}`,
    ...(board.image_url ? { image: `${SITE_URL}${board.image_url}` } : {}),
    offers: { "@type": "Offer", price: board.price, priceCurrency: "JPY" },
  };

  return (
    <SeoPage
      breadcrumbs={[
        { name: "ボード一覧", href: "/boards" },
        { name: `${board.brand} ${board.model}`, href: `/boards/${slug}` },
      ]}
      jsonLd={[productLd]}
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-sky-300/90 mb-1">{board.brand} · {board.year}年モデル</p>
      <h1 className="text-3xl font-black text-white leading-tight mb-3">{board.brand} {board.model}</h1>
      <p className="text-sm text-slate-300 leading-relaxed mb-5">{describeBoard(board)}</p>

      <section className="grid grid-cols-2 gap-2 mb-6" aria-label="基本スペック">
        {[
          { label: "形状", value: SHAPE_LABELS[board.shape] ?? board.shape, sub: SHAPE_DESCRIPTIONS[board.shape] },
          { label: "硬さ（フレックス）", value: `${getFlexLabel(board.flex)} ${board.flex}/10`, sub: FLEX_DESCRIPTIONS[flexCategory] },
          {
            label: "価格",
            value: `¥${estimated.toLocaleString()}`,
            sub: estimated < board.price ? `定価 ¥${board.price.toLocaleString()}（型落ち・セールを見込んだ想定価格）` : "定価",
          },
          { label: "対象", value: GENDER_LABELS[board.gender] ?? board.gender, sub: `展開サイズ ${board.available_lengths.length}種類` },
        ].map((spec) => (
          <div key={spec.label} className="glass rounded-2xl p-3.5">
            <p className="text-xs text-slate-400 mb-0.5">{spec.label}</p>
            <p className="text-base font-bold text-white">{spec.value}</p>
            {spec.sub && <p className="text-xs text-slate-400 leading-relaxed mt-1">{spec.sub}</p>}
          </div>
        ))}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-3">スタイル別の適性</h2>
        <ul className="glass rounded-2xl p-4 space-y-3">
          {STYLE_KEYS.map((k) => (
            <li key={k} className="flex items-center gap-3">
              <span className="w-28 flex-shrink-0 text-sm text-slate-200">
                {STYLE_ICONS[k]} {STYLE_LABELS[k]}
              </span>
              <span className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                  style={{ width: `${board.style_scores[k] * 10}%` }}
                />
              </span>
              <span className="w-10 text-right text-sm font-bold text-white tabular-nums">{board.style_scores[k]}/10</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">身長別のおすすめサイズ</h2>
        <p className="text-xs text-slate-400 mb-3">
          標準体重・オールラウンドの場合の目安です。展開サイズ（{board.available_lengths.join(" / ")}cm）の中から最も近いものを選んでいます。
        </p>
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 text-left">
                <th className="px-4 py-2.5 font-medium">身長</th>
                <th className="px-4 py-2.5 font-medium">理想の長さ</th>
                <th className="px-4 py-2.5 font-medium">このボードのおすすめ</th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.map((row) => (
                <tr key={row.height} className="border-t border-white/[0.06]">
                  <td className="px-4 py-2 text-slate-200 tabular-nums">{row.height}cm</td>
                  <td className="px-4 py-2 text-slate-300 tabular-nums">{row.ideal}cm前後</td>
                  <td className="px-4 py-2 tabular-nums">
                    <span className={row.fits ? "font-bold text-white" : "text-slate-400"}>{row.size}cm</span>
                    {!row.fits && <span className="ml-1 text-xs text-amber-200">（合うサイズなし）</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DiagnoseCta
        from="board_page"
        title={`${board.model} があなたに合うか診断する`}
        description="体重・レベル・滑りのスタイルまで考慮して、最適なサイズと他の候補も提案します。"
      />

      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-3">購入先を探す</h2>
        <div className="flex flex-wrap gap-2">
          {board.url && (
            <a href={board.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl glass text-sm text-slate-200 hover:bg-white/10">
              公式・販売ページ
            </a>
          )}
          <a href={getRakutenSearchUrl(board.brand, board.model)} target="_blank" rel="noopener noreferrer sponsored" className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-400/30 text-sm text-red-200 hover:bg-red-500/15">
            楽天で探す
          </a>
          <a href={getAmazonSearchUrl(board.brand, board.model)} target="_blank" rel="noopener noreferrer sponsored" className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-sm text-amber-200 hover:bg-amber-500/15">
            Amazonで探す
          </a>
          <a href={getYahooSearchUrl(board.brand, board.model)} target="_blank" rel="noopener noreferrer sponsored" className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/30 text-sm text-rose-200 hover:bg-rose-500/15">
            Yahoo!で探す
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-white mb-3">{board.model} に似ているボード</h2>
        <ul className="space-y-2">
          {similar.map((b) => (
            <BoardRow key={boardSlug(b)} board={b} />
          ))}
        </ul>
      </section>
    </SeoPage>
  );
}
