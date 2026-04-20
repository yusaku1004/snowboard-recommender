import { UserInput, GenderPreference, Shape, FlexCategory, PriceRange } from "@/types";

export type FilterState = {
  brands: Set<string> | null;
  shapes: Set<Shape> | null;
  flex: Set<FlexCategory> | null;
  priceRanges: Set<PriceRange> | null;
};

export function encodeInput(input: UserInput): string {
  const params = new URLSearchParams();
  params.set("h", String(input.height));
  params.set("w", String(input.weight));
  params.set("gt", String(input.style.ground_tricks));
  params.set("pk", String(input.style.park));
  params.set("cv", String(input.style.carving));
  params.set("rt", String(input.style.run_tricks));
  params.set("pw", String(input.style.powder));
  params.set("b", String(input.budget));
  params.set("g", input.gender);
  if (input.budgetFlexibility > 0) {
    params.set("bf", String(input.budgetFlexibility));
  }
  return params.toString();
}

export function decodeInput(search: string): UserInput | null {
  const params = new URLSearchParams(search);
  const h = params.get("h");
  const w = params.get("w");
  const gt = params.get("gt");
  const pk = params.get("pk");
  const cv = params.get("cv");
  const rt = params.get("rt");
  const pw = params.get("pw");
  const b = params.get("b");

  if (!h || !w || !gt || !pk || !cv || !rt || !pw || !b) return null;

  const g = params.get("g");
  const validGenders: GenderPreference[] = ["mens", "womens", "all"];
  const gender: GenderPreference = g && validGenders.includes(g as GenderPreference)
    ? (g as GenderPreference)
    : "all";

  const bf = params.get("bf");

  const clamp = (v: number, min: number, max: number) =>
    isNaN(v) ? min : Math.min(max, Math.max(min, v));
  const clampStyle = (v: number) => clamp(v, 1, 5);

  return {
    height: clamp(Number(h), 140, 200),
    weight: clamp(Number(w), 30, 120),
    gender,
    style: {
      ground_tricks: clampStyle(Number(gt)),
      park: clampStyle(Number(pk)),
      carving: clampStyle(Number(cv)),
      run_tricks: clampStyle(Number(rt)),
      powder: clampStyle(Number(pw)),
    },
    budget: clamp(Number(b), 50000, 200000),
    budgetFlexibility: bf ? clamp(Number(bf), 0, 100) : 0,
  };
}

export function decodeFilters(search: string): FilterState {
  const params = new URLSearchParams(search);

  const brandsStr = params.get("brands");
  const brands = brandsStr ? new Set(brandsStr.split(",").filter(Boolean)) : null;

  const shapesStr = params.get("shapes");
  const validShapes: Shape[] = ["camber", "rocker", "flat", "hybrid_camber", "hybrid_rocker", "double_camber"];
  const shapes = shapesStr
    ? new Set(shapesStr.split(",").filter((s): s is Shape => validShapes.includes(s as Shape)))
    : null;
  const shapesResult = shapes && shapes.size > 0 ? shapes : null;

  const flexStr = params.get("flex");
  const validFlex: FlexCategory[] = ["soft", "mid", "hard"];
  const flex = flexStr
    ? new Set(flexStr.split(",").filter((f): f is FlexCategory => validFlex.includes(f as FlexCategory)))
    : null;
  const flexResult = flex && flex.size > 0 ? flex : null;

  const prStr = params.get("pr");
  const validPr: PriceRange[] = ["under50", "50to80", "80to100", "over100"];
  const priceRanges = prStr
    ? new Set(prStr.split(",").filter((p): p is PriceRange => validPr.includes(p as PriceRange)))
    : null;
  const priceRangesResult = priceRanges && priceRanges.size > 0 ? priceRanges : null;

  return { brands, shapes: shapesResult, flex: flexResult, priceRanges: priceRangesResult };
}

export function getShareUrl(input: UserInput, filters?: FilterState): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams(encodeInput(input));
  if (filters) {
    if (filters.brands !== null) {
      params.set("brands", Array.from(filters.brands).join(","));
    }
    if (filters.shapes !== null) {
      params.set("shapes", Array.from(filters.shapes).join(","));
    }
    if (filters.flex !== null) {
      params.set("flex", Array.from(filters.flex).join(","));
    }
    if (filters.priceRanges !== null) {
      params.set("pr", Array.from(filters.priceRanges).join(","));
    }
  }
  return `${base}/?${params.toString()}`;
}

export function getTwitterShareUrl(input: UserInput, topBoardName: string): string {
  const url = getShareUrl(input);
  const text = `スノーボード診断で「${topBoardName}」がおすすめされました！あなたもぴったりの板を見つけよう`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}
