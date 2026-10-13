export type Shape = "camber" | "rocker" | "flat" | "hybrid_camber" | "hybrid_rocker" | "double_camber";

export type FlexCategory = "soft" | "mid" | "hard";

export type PriceRange = "under50" | "50to80" | "80to100" | "over100";

export type BoardGender = "mens" | "womens" | "unisex";

export type GenderPreference = "mens" | "womens" | "all";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

// ブーツサイズの目安（small: 〜26.5cm / medium: 27〜27.5cm / large: 28cm〜）。未回答は undefined
export type BootSize = "small" | "medium" | "large";

export interface StyleScores {
  ground_tricks: number;
  park: number;
  carving: number;
  run_tricks: number;
  powder: number;
}

// 楽天市場の実売情報（scripts/update_rakuten.ts が定期取得）
export interface RakutenOffer {
  // 一致した出品の最安値（税込）
  price: number;
  // 商品ページ（アフィリエイトURL）
  url: string;
  imageUrl?: string;
  // 取得日（YYYY-MM-DD）
  fetchedAt: string;
}

export interface Board {
  brand: string;
  model: string;
  year: number;
  flex: number;
  shape: Shape;
  gender: BoardGender;
  available_lengths: number[];
  price: number;
  image_url?: string;
  url?: string;
  riding_type?: string;
  style_scores: StyleScores;
  offer?: RakutenOffer;
  // 前年モデルの仕様を引き継いで自動作成したエントリ（例: 2026年の仕様で作った2027年モデル）
  specs_from_year?: number;
  // 長さ(cm) → ウエスト幅(mm)。楽天の商品説明から自動取得できたモデルだけ（board_waists.json）
  waist_widths?: Record<string, number>;
}

export interface UserInput {
  height: number;
  weight: number;
  gender: GenderPreference;
  level: SkillLevel;
  style: StyleScores;
  budget: number;
  budgetFlexibility: number; // 0〜50 (%)
  bootSize?: BootSize;
}

export interface RecommendResult {
  board: Board;
  matchPercentage: number;
  recommendedSize: number;
  overBudget: boolean;
  estimatedPrice: number;
  // おすすめ理由のタグ（例: "グラトリ向き", "152cmがぴったり"）
  reasons?: string[];
}
