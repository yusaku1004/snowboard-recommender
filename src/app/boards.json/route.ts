import { ALL_BOARDS } from "@/lib/boardsData";
import { Board } from "@/types";

// ボードデータを JS バンドルに含めず、ビルド時に静的ファイルとして配信する
export const dynamic = "force-static";

export function GET() {
  const boards: Board[] = ALL_BOARDS.map((b) => ({
    brand: b.brand,
    model: b.model,
    year: b.year,
    flex: b.flex,
    shape: b.shape,
    gender: b.gender,
    available_lengths: b.available_lengths,
    price: b.price,
    style_scores: b.style_scores,
    ...(b.image_url ? { image_url: b.image_url } : {}),
    ...(b.url ? { url: b.url } : {}),
    ...(b.offer ? { offer: b.offer } : {}),
    ...(b.specs_from_year ? { specs_from_year: b.specs_from_year } : {}),
  }));
  return Response.json(boards);
}
