import type { Metadata } from "next";

// 検索用ページのメタデータ。openGraph / twitter はレイアウトの設定と「統合」ではなく「置き換え」になるため、
// 画像を含めてページごとにすべて指定する。
export function pageMetadata({
  title,
  description,
  path,
  image = "/og",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "スノーボード診断",
      locale: "ja_JP",
      title,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
