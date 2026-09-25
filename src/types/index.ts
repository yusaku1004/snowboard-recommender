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
