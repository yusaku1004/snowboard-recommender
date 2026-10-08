import Link from "next/link";

const LINKS = [
  { href: "/", label: "スノーボード診断" },
  { href: "/types", label: "スノーボーダータイプ" },
  { href: "/ranking", label: "おすすめランキング" },
  { href: "/size", label: "身長別サイズの目安" },
  { href: "/boards", label: "ボード一覧" },
];

// 全ページ共通のフッター（サイト内リンク。検索エンジンが各ページを辿れるようにする）
export function SiteFooter() {
  return (
    <footer className="relative z-10 w-full max-w-2xl mx-auto px-4 pb-28 pt-4">
      <nav aria-label="サイト内リンク" className="border-t border-white/10 pt-5">
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-sky-300 underline-offset-2 hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* 楽天ウェブサービスのクレジット表記（規約により提供されたHTMLをそのまま使う） */}
      <div
        className="mt-4 text-center text-xs text-slate-400 [&_a]:underline-offset-2 [&_a:hover]:underline"
        dangerouslySetInnerHTML={{
          __html: '<a href="https://developers.rakuten.com/" target="_blank">Supported by Rakuten Developers</a>',
        }}
      />
    </footer>
  );
}
