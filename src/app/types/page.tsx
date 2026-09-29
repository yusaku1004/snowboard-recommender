import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/pageMetadata";
import { SeoPage } from "@/components/seo/SeoPage";
import { DiagnoseCta } from "@/components/seo/DiagnoseCta";
import { RIDER_TYPES } from "@/lib/riderTypes";

export const metadata: Metadata = pageMetadata({
  title: "スノーボーダータイプ一覧（全12タイプ） | スノーボード診断",
  description:
    "グラトリ職人、カービング求道者、パウダーハンターなど、滑り方の好みとレベルから分かる12のスノーボーダータイプ。それぞれの特徴と相性のいいボードを紹介します。",
  path: "/types",
});

export default function RiderTypesIndexPage() {
  return (
    <SeoPage breadcrumbs={[{ name: "スノーボーダータイプ", href: "/types" }]}>
      <h1 className="text-3xl font-black text-white leading-tight mb-3">スノーボーダータイプ一覧</h1>
      <p className="text-sm text-slate-300 mb-5">
        滑り方の好みとレベルから分かる、全12タイプ。あなたはどのタイプ？
      </p>
      <DiagnoseCta from="types_index" title="自分のタイプを診断する" />
      <ul className="space-y-2">
        {RIDER_TYPES.map((t) => (
          <li key={t.id}>
            <Link href={`/types/${t.id}`} className="glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.08] transition-colors">
              <span
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }}
                aria-hidden="true"
              >
                {t.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-white">{t.name}</span>
                <span className="block text-xs text-slate-300 mt-0.5">{t.tagline}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SeoPage>
  );
}
