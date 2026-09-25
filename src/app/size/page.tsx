import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { SeoPage } from "@/components/seo/SeoPage";
import { DiagnoseCta } from "@/components/seo/DiagnoseCta";
import { SIZE_PAGE_HEIGHTS, getSizeTable } from "@/lib/seo";

const title = "スノーボードのサイズの目安｜身長・体重・スタイル別の早見表 | スノーボード診断";
const description =
  "スノーボードの長さの選び方と、身長145〜195cmのサイズ早見表。体重やスタイル（グラトリ・カービングなど）による調整の仕方も解説します。";

export const metadata: Metadata = pageMetadata({ title, description, path: "/size" });

export default function SizeIndexPage() {
  return (
    <SeoPage breadcrumbs={[{ name: "身長別サイズの目安", href: "/size" }]}>
      <h1 className="text-3xl font-black text-white leading-tight mb-3">スノーボードのサイズの目安</h1>
      <p className="text-sm text-slate-300 leading-relaxed mb-5">
        標準体重・オールラウンドの場合の目安です。身長を選ぶと、体重やスタイル別の詳しいサイズを確認できます。
      </p>
      <div className="overflow-x-auto glass rounded-2xl mb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 text-left">
              <th className="px-4 py-2.5 font-medium">身長</th>
              <th className="px-4 py-2.5 font-medium">ボードの長さの目安</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_PAGE_HEIGHTS.map((h) => (
              <tr key={h} className="border-t border-white/[0.06]">
                <td className="px-4 py-2.5">
                  <Link href={`/size/${h}`} className="text-sky-200 hover:underline underline-offset-2 tabular-nums">
                    {h}cm
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-bold text-white tabular-nums">{getSizeTable(h).rows[1].sizes[1]}cm前後</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DiagnoseCta from="size_index" />
    </SeoPage>
  );
}
