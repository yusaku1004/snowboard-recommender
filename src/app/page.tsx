import { preload } from "react-dom";
import { Wizard } from "@/components/wizard/Wizard";
import { decodeInput, decodeFilters } from "@/lib/share";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  const search = params.toString();
  // 共有URLから開いた場合は結果画面から表示する
  const initialInput = search ? decodeInput(search) : null;
  const initialFilters = initialInput ? decodeFilters(search) : null;
  // 共有URLは最初から結果画面なので、ボードデータの取得をHTML読み込みと並行して始める
  if (initialInput) preload("/boards.json", { as: "fetch", crossOrigin: "anonymous" });

  return (
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-28">
      <Wizard
        initialInput={initialInput}
        initialFilters={initialFilters}
        aiEnabled={Boolean(process.env.GEMINI_API_KEY)}
      />
    </main>
  );
}
