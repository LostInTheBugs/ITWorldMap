import { useState, useMemo } from "react";
import Map from "./components/Map";
import ScatterPlot from "./components/ScatterPlot";
import indicatorsRaw from "./data/indicators.json";
import type { CountryData } from "./data/types";

const indicatorsData = indicatorsRaw as CountryData[];

const ALL_INDICATORS: { key: string; label: string }[] = [
  { key: "population", label: "👥 Population" },
  { key: "gdp_per_capita", label: "💰 PIB / habitant ($ US)" },
  { key: "co2_per_capita", label: "🏭 CO₂ / habitant (tonnes)" },
  { key: "internet_users_pct", label: "🌐 Utilisateurs Internet (%)" },
  { key: "mobile_subscriptions_per100", label: "📱 Abonnements mobiles /100 hab." },
  { key: "fixed_broadband_per100", label: "🛜 Haut débit fixe /100 hab." },
  { key: "electricity_access_pct", label: "⚡ Accès électricité (%)" },
  { key: "secure_servers_per_million", label: "🔒 Serveurs sécurisés /M hab." },
];

type XAxis = "gdp_per_capita" | "population";

const X_LABELS: Record<XAxis, string> = {
  gdp_per_capita: "PIB / habitant ($ US)",
  population: "Population",
};

export default function App() {
  const [indicator, setIndicator] = useState("population");
  const [showCables, setShowCables] = useState(false);
  const [xAxis, setXAxis] = useState<XAxis>("gdp_per_capita");

  // Build indicator list from keys actually present in the data
  const INDICATORS = useMemo(() => {
    const availableKeys = new Set(
      indicatorsData.flatMap((c) => Object.keys(c)).filter((k) => k !== "iso3" && !k.endsWith("_year")),
    );
    return ALL_INDICATORS.filter((ind) => availableKeys.has(ind.key));
  }, []);

  // Ensure the current indicator is valid; reset if unavailable
  const activeIndicator = INDICATORS.some((i) => i.key === indicator) ? indicator : INDICATORS[0]?.key ?? "population";

  const yLabel = INDICATORS.find((i) => i.key === activeIndicator)?.label || "";
  const xLabel = X_LABELS[xAxis];

  return (
    <>
      <Map data={indicatorsData} indicator={activeIndicator} showCables={showCables} />

      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", maxWidth: 260 }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700 }}>🌍 ITWorldMap</h1>
        <select value={activeIndicator} onChange={(e) => setIndicator(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, outline: "none" }}>
          {INDICATORS.map((ind) => (<option key={ind.key} value={ind.key}>{ind.label}</option>))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={showCables} onChange={(e) => setShowCables(e.target.checked)} />
          🔌 Câbles sous-marins
        </label>
      </div>

      <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
            {xLabel} vs. {yLabel}
          </span>
          <select value={xAxis} onChange={(e) => setXAxis(e.target.value as XAxis)} style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #ccc", fontSize: 11, outline: "none" }}>
            <option value="gdp_per_capita">Axe X : PIB</option>
            <option value="population">Axe X : Population</option>
          </select>
        </div>
        <ScatterPlot data={indicatorsData} xIndicator={xAxis} yIndicator={activeIndicator} xLabel={xLabel} yLabel={yLabel} />
      </div>
    </>
  );
}
