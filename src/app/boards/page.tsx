import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { SeoPage } from "@/components/seo/SeoPage";
import { DiagnoseCta } from "@/components/seo/DiagnoseCta";
import { boardSlug, getBoardsByBrand } from "@/lib/seo";

const title = "スノーボード一覧（85ブランド・1,000本以上） | スノーボード診断";
const description =
  "2026年モデルのスノーボードをブランド別に一覧で掲載。各ボードのフレックス・形状・スタイル別の適性・身長別のおすすめサイズを確認できます。";

export const metadata: Metadata = pageMetadata({ title, description, path: "/boards" });

export default function BoardsIndexPage() {
  const groups = getBoardsByBrand();
  const total = groups.reduce((n, g) => n + g.boards.length, 0);

  return (
    <SeoPage breadcrumbs={[{ name: "ボード一覧", href: "/boards" }]}>
      <h1 className="text-3xl font-black text-white leading-tight mb-2">スノーボード一覧</h1>
      <p className="text-sm text-slate-300 mb-5">
        {groups.length}ブランド・{total.toLocaleString()}本のボードを掲載しています。気になるボードを選ぶと、特徴やおすすめサイズを確認できます。
      </p>

      <nav aria-label="ブランド" className="glass rounded-2xl p-4 mb-6">
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
          {groups.map((g) => (
            <li key={g.brand}>
              <a href={`#${boardSlug({ brand: g.brand, model: "" })}`} className="text-sky-200 hover:underline underline-offset-2">
                {g.brand}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <DiagnoseCta from="boards_index" title="どれを選べばいいか迷ったら" />

      {groups.map((g) => (
        <section key={g.brand} id={boardSlug({ brand: g.brand, model: "" })} className="mb-6 scroll-mt-4">
          <h2 className="text-lg font-bold text-white mb-2">
            {g.brand} <span className="text-sm font-normal text-slate-400">（{g.boards.length}本）</span>
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {g.boards.map((b) => (
              <li key={boardSlug(b)}>
                <Link href={`/boards/${boardSlug(b)}`} className="text-slate-200 hover:text-sky-200 hover:underline underline-offset-2">
                  {b.model}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </SeoPage>
  );
}
