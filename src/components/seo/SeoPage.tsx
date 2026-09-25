import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

export interface Crumb {
  name: string;
  href: string;
}

interface SeoPageProps {
  breadcrumbs: Crumb[];
  children: React.ReactNode;
  // 追加の構造化データ（Product など）
  jsonLd?: object[];
}

// 検索流入用ページの共通レイアウト（ヘッダー・パンくず・構造化データ）
export function SeoPage({ breadcrumbs, children, jsonLd = [] }: SeoPageProps) {
  const crumbs: Crumb[] = [{ name: "トップ", href: "/" }, ...breadcrumbs];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href === "/" ? "" : c.href}`,
    })),
  };

  return (
    <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-10">
      {[breadcrumbLd, ...jsonLd].map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}
      <header className="flex items-center justify-center mb-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 shadow-[0_0_14px_rgba(56,189,248,0.5)] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M5 19L19 5" />
            </svg>
          </span>
          <span className="text-sm font-bold tracking-tight text-white">スノーボード診断</span>
        </Link>
      </header>
      <nav aria-label="パンくずリスト" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
          {crumbs.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">›</span>}
              {i < crumbs.length - 1 ? (
                <Link href={c.href} className="hover:text-sky-300 underline-offset-2 hover:underline">
                  {c.name}
                </Link>
              ) : (
                <span className="text-slate-300" aria-current="page">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {children}
    </main>
  );
}
