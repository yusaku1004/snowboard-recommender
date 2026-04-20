"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-extrabold text-rose-400 mb-4">⚠</p>
      <h1 className="text-xl font-bold text-white mb-2">エラーが発生しました</h1>
      <p className="text-slate-500 text-sm mb-8">予期しないエラーが発生しました。もう一度お試しください。</p>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:from-sky-400 hover:to-cyan-300 transition-all cursor-pointer"
      >
        再試行する
      </button>
    </main>
  );
}
