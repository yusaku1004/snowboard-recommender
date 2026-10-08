// "2026-10-05" → "10/5"
export function formatShortDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  return `${m}/${d}`;
}
