export type Shape = "camber" | "rocker" | "flat" | "hybrid_camber" | "double_camber";

export type BoardGender = "mens" | "womens" | "unisex";

export type GenderPreference = "mens" | "womens" | "all";

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
  style_scores: StyleScores;
}

export interface UserInput {
  height: number;
  weight: number;
  gender: GenderPreference;
  style: StyleScores;
  budget: number;
  budgetFlexibility: number; // 0〜50 (%)
}

export interface RecommendResult {
  board: Board;
  matchPercentage: number;
  recommendedSize: number;
  overBudget: boolean;
  estimatedPrice: number;
}
