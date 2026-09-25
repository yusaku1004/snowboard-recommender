import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoPage } from "@/components/seo/SeoPage";
import { DiagnoseCta } from "@/components/seo/DiagnoseCta";
import { SIZE_PAGE_HEIGHTS, getSizeTable, standardWeight } from "@/lib/seo";

type Params = { height: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return SIZE_PAGE_HEIGHTS.map((h) => ({ height: String(h) }));
}

function parseHeight(value: string): number | null {
  const h = Number(value);
  return SIZE_PAGE_HEIGHTS.includes(h) ? h : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const height = parseHeight((await params).height);
  if (!height) return {};
  const base = getSizeTable(height).rows[1].sizes[1];
  const title = `身長${height}cmのスノーボードのサイズの目安は？体重・スタイル別に解説 | スノーボード診断`;
  const description = `身長${height}cmの人に合うスノーボードの長さは${base}cm前後が目安。体重（軽め・標準・重め）とスタイル（グラトリ・オールラウンド・カービング）別のおすすめサイズを一覧で紹介します。`;
  return pageMetadata({ title, description, path: `/size/${height}` });
}

export default async function SizePage({ params }: { params: Promise<Params> }) {
  const height = parseHeight((await params).height);
  if (!height) notFound();
  const table = getSizeTable(height);
  const base = table.rows[1].sizes[1];

  return (
    <SeoPage
      breadcrumbs={[
        { name: "身長別サイズの目安", href: "/size" },
        { name: `身長${height}cm`, href: `/size/${height}` },
      ]}
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-sky-300/90 mb-1">SIZE GUIDE</p>
      <h1 className="text-3xl font-black text-white leading-tight mb-3">身長{height}cmのスノーボードのサイズ</h1>
      <p className="text-sm text-slate-300 leading-relaxed mb-5">
        身長{height}cm・標準体重（{standardWeight(height)}kg）でオールラウンドに滑る場合、ボードの長さは
        <strong className="text-white">{base}cm前後</strong>が目安です。体重が重い人や、カービング・パウダー重視の人は長め、グラトリ・パーク重視の人は短めが扱いやすくなります。
      </p>

      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-3">体重・スタイル別のおすすめサイズ</h2>
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 text-left">
                <th className="px-3 py-2.5 font-medium">体重</th>
                {table.styles.map((s) => (
                  <th key={s} className="px-3 py-2.5 font-medium">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.label} className="border-t border-white/[0.06]">
                  <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{row.label}</td>
                  {row.sizes.map((size, i) => (
                    <td key={i} className="px-3 py-2.5 font-bold text-white tabular-nums">{size}cm</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          初心者は取り回しやすさを優先して、表の値から{Math.abs(table.beginnerAdjustment)}cmほど短めがおすすめです。
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-2">サイズの決め方</h2>
        <ul className="glass rounded-2xl p-4 space-y-2 text-sm text-slate-300 leading-relaxed">
          <li>・基準は「身長 − 15cm」。そこから体重とスタイルで調整します。</li>
          <li>・標準体重（(身長−100)×0.9）より5kg以上重ければ+1〜2cm、軽ければ−1〜2cm。</li>
          <li>・グラトリ・パーク重視なら短め（回しやすい）、カービング・パウダー重視なら長め（安定する）。</li>
          <li>・ボードごとに展開サイズが違うので、目安に最も近いサイズを選びます。</li>
        </ul>
      </section>

      <DiagnoseCta
        from={`size_${height}`}
        title="あなたにぴったりのサイズとボードを診断する"
        description="体重・レベル・スタイルを入力すると、1,000本以上のボードから展開サイズまで考慮しておすすめを提案します。"
      />

      <section>
        <h2 className="text-lg font-bold text-white mb-3">ほかの身長のサイズ目安</h2>
        <ul className="flex flex-wrap gap-2">
          {SIZE_PAGE_HEIGHTS.filter((h) => h !== height).map((h) => (
            <li key={h}>
              <Link href={`/size/${h}`} className="inline-block px-3.5 py-2 rounded-full glass text-sm text-slate-200 hover:bg-white/10 tabular-nums">
                {h}cm
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SeoPage>
  );
}
