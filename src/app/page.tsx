import type { Metadata } from "next";
import { preload } from "react-dom";
import { Wizard } from "@/components/wizard/Wizard";
import { decodeInput, decodeFilters } from "@/lib/share";
import { getTopResult } from "@/lib/shareResult";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function toSearchString(searchParams: SearchParams): Promise<string> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params.toString();
}

// 共有URLで開かれた場合は、診断結果（1位のボード）を載せたタイトルとOGP画像にする
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const search = await toSearchString(searchParams);
  const input = search ? decodeInput(search) : null;
  if (!input) return {};
  const top = getTopResult(input, decodeFilters(search));
  if (!top) return {};

  const title = `診断結果：${top.board.brand} ${top.board.model}がベストマッチ | スノーボード診断`;
  const description = `マッチ度${top.matchPercentage}%・おすすめサイズ${top.recommendedSize}cm。あなたも身長・体重・スタイルを答えて、ぴったりの板を約1分で診断しよう。`;
  const image = { url: `/og?${search}`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    openGraph: { title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const search = await toSearchString(searchParams);
  // 共有URLから開いた場合は結果画面から表示する
  const initialInput = search ? decodeInput(search) : null;
  const initialFilters = initialInput ? decodeFilters(search) : null;
  // 共有URLは最初から結果画面なので、ボードデータの取得をHTML読み込みと並行して始める
  if (initialInput) preload("/boards.json", { as: "fetch", crossOrigin: "anonymous" });

  return (
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-8">
      <Wizard
        initialInput={initialInput}
        initialFilters={initialFilters}
        aiEnabled={Boolean(process.env.GEMINI_API_KEY)}
      />
    </main>
  );
}
