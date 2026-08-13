// Modes d'échelle de couleur pour la carte et la légende.
// Le calcul des seuils doit rester partagé (MapPanel calcule les seuils,
// la légende et la colorisation les consomment) pour garantir la cohérence.
export type ScaleMode = "quantiles" | "equal" | "fixed" | "mean" | "median" | "custom";

// Seuils FIXES par indicateur (mode "fixed") : stables dans le temps —
// la légende ne bouge plus pendant la lecture automatique des années.
export const FIXED_THRESHOLDS: Record<string, number[]> = {
  population: [1_000_000, 5_000_000, 20_000_000, 50_000_000, 100_000_000],
  gdp_per_capita: [1_000, 3_000, 10_000, 25_000, 50_000],
  co2_per_capita: [0.5, 1.5, 3, 6, 12],
  internet_users_pct: [5, 15, 30, 50, 75],
  mobile_subscriptions_per100: [10, 30, 60, 100, 150],
  fixed_broadband_per100: [2, 10, 25, 40, 60],
  electricity_access_pct: [40, 60, 80, 90, 99],
  secure_servers_per_million: [1, 10, 100, 1_000, 10_000],
};

const N_THRESHOLDS = 5; // 6 couleurs de PALETTE → 6 classes → 5 seuils

function mean(v: number[]): number {
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function median(v: number[]): number {
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function stdev(v: number[], center: number): number {
  if (v.length < 2) return 0;
  return Math.sqrt(v.reduce((a, b) => a + (b - center) ** 2, 0) / v.length);
}

function quantiles(values: number[]): number[] {
  const t: number[] = [];
  for (let i = 1; i <= N_THRESHOLDS; i++) {
    t.push(values[Math.floor((values.length * i) / (N_THRESHOLDS + 1))] ?? values[values.length - 1]);
  }
  return t;
}

function centered(mu: number, sd: number): number[] {
  // 5 seuils : la classe centrale est centrée sur mu (moyenne ou médiane)
  return [mu - 1.5 * sd, mu - 0.75 * sd, mu - 0.25 * sd, mu + 0.25 * sd, mu + 0.75 * sd];
}

/**
 * Calcule les seuils selon le mode. `values` doit être TRIÉ croissant.
 * Modes dynamiques (quantiles/equal/mean/median) : recalculés à chaque année.
 * Modes stables (fixed/custom) : constants pendant le play.
 */
export function computeThresholds(
  values: number[],
  mode: ScaleMode,
  custom: string,
  fixed?: number[],
): number[] {
  if (values.length === 0) return [0, 0, 0, 0, 0];
  const min = values[0];
  const max = values[values.length - 1];
  switch (mode) {
    case "equal": {
      const t: number[] = [];
      for (let i = 1; i <= N_THRESHOLDS; i++) t.push(min + ((max - min) * i) / (N_THRESHOLDS + 1));
      return t;
    }
    case "fixed":
      return fixed && fixed.length > 0 ? [...fixed].slice(0, N_THRESHOLDS) : quantiles(values);
    case "mean": {
      const mu = mean(values);
      return centered(mu, stdev(values, mu) || Math.max(max - mu, mu - min));
    }
    case "median": {
      const med = median(values);
      return centered(med, stdev(values, med) || Math.max(max - med, med - min));
    }
    case "custom": {
      const parsed = custom
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);
      return parsed.length > 0 ? parsed.slice(0, N_THRESHOLDS) : quantiles(values);
    }
    case "quantiles":
    default:
      return quantiles(values);
  }
}
