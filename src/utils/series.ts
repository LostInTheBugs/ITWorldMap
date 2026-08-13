/** Séries temporelles : indicateur → iso3 → année → valeur */
export type YearSeries = Record<string, Record<string, Record<string, number>>>;

let cache: Promise<YearSeries> | null = null;

export function fetchSeries(): Promise<YearSeries> {
  if (!cache) {
    cache = fetch("/series.json")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<YearSeries>; })
      .catch((e) => { cache = null; throw e; });
  }
  return cache;
}

/** Valeur d'un pays à une année donnée (undefined si absente). */
export function seriesValue(
  series: YearSeries | null | undefined,
  indicatorKey: string,
  iso3: string,
  year: number,
): number | undefined {
  const v = series?.[indicatorKey]?.[iso3]?.[String(year)];
  return typeof v === "number" && isFinite(v) ? v : undefined;
}

/** Plage d'années globale (min/max sur toutes les séries). */
export function seriesYearRange(series: YearSeries | null | undefined): [number, number] | null {
  if (!series) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const byCountry of Object.values(series)) {
    for (const byYear of Object.values(byCountry)) {
      for (const y of Object.keys(byYear)) {
        const n = Number(y);
        if (n < min) min = n;
        if (n > max) max = n;
      }
    }
  }
  return min === Infinity ? null : [min, max];
}
