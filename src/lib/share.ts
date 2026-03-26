import { UserInput, GenderPreference } from "@/types";

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

  return {
    height: Number(h),
    weight: Number(w),
    gender,
    style: {
      ground_tricks: Number(gt),
      park: Number(pk),
      carving: Number(cv),
      run_tricks: Number(rt),
      powder: Number(pw),
    },
    budget: Number(b),
    budgetFlexibility: bf ? Number(bf) : 0,
  };
}

export function getShareUrl(input: UserInput): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/?${encodeInput(input)}`;
}

export function getTwitterShareUrl(input: UserInput, topBoardName: string): string {
  const url = getShareUrl(input);
  const text = `スノーボード診断で「${topBoardName}」がおすすめされました！あなたもぴったりの板を見つけよう`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}
