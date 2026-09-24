import { Board, StyleScores, UserInput } from "@/types";

export function makeStyle(overrides: Partial<StyleScores> = {}): StyleScores {
  return { ground_tricks: 3, park: 3, carving: 3, run_tricks: 3, powder: 3, ...overrides };
}

export function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    brand: "TEST",
    model: "MODEL",
    year: 2026,
    flex: 5,
    shape: "camber",
    gender: "unisex",
    available_lengths: [150, 153, 155, 157, 160],
    price: 80000,
    style_scores: { ground_tricks: 5, park: 5, carving: 5, run_tricks: 5, powder: 5 },
    ...overrides,
  };
}

export function makeInput(overrides: Partial<UserInput> = {}): UserInput {
  return {
    height: 170,
    weight: 63, // 標準体重 (170-100)*0.9
    gender: "all",
    style: makeStyle(),
    budget: 100000,
    budgetFlexibility: 0,
    ...overrides,
  };
}
