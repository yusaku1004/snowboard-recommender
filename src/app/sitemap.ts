import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { RANKINGS, SIZE_PAGE_HEIGHTS, getAllBoardSlugs } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" = "monthly") => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    page("", 1, "weekly"),
    page("/ranking", 0.8, "weekly"),
    ...RANKINGS.map((r) => page(`/ranking/${r.slug}`, 0.8, "weekly")),
    page("/size", 0.8),
    ...SIZE_PAGE_HEIGHTS.map((h) => page(`/size/${h}`, 0.7)),
    page("/boards", 0.6),
    ...getAllBoardSlugs().map((slug) => page(`/boards/${slug}`, 0.5)),
  ];
}
