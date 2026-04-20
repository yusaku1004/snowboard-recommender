import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-sky-400 mb-4">404</p>
      <h1 className="text-xl font-bold text-white mb-2">ページが見つかりません</h1>
      <p className="text-slate-500 text-sm mb-8">お探しのページは存在しないか、移動した可能性があります。</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:from-sky-400 hover:to-cyan-300 transition-all"
      >
        診断トップへ戻る
      </Link>
    </main>
  );
}
