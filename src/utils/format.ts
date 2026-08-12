export function fmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  if (n < 1 && n > 0) return n.toPrecision(2).replace(/0+$/, "").replace(/\.$/, "");
  return n.toFixed(1);
}
