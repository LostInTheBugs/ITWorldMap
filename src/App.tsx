import { useState } from "react";
import Map from "./components/Map";
import ScatterPlot from "./components/ScatterPlot";
import indicatorsData from "./data/indicators.json";

const INDICATORS: { key: string; label: string }[] = [
  { key: "population", label: "👥 Population" },
  { key: "gdp_per_capita", label: "💰 PIB / habitant ($ US)" },
  { key: "co2_per_capita", label: "🏭 CO₂ / habitant (tonnes)" },
  { key: "internet_users_pct", label: "🌐 Utilisateurs Internet (%)" },
  { key: "ipv6_adoption_pct", label: "🔗 Adoption IPv6 (%)" },
];

export default function App() {
  const [indicator, setIndicator] = useState("population");
  const [showCables, setShowCables] = useState(false);

  return (
    <>
      <Map data={indicatorsData as any} indicator={indicator} showCables={showCables} />

      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", maxWidth: 260 }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700 }}>🌍 ITWorldMap</h1>
        <select value={indicator} onChange={(e) => setIndicator(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, outline: "none" }}>
          {INDICATORS.map((ind) => (<option key={ind.key} value={ind.key}>{ind.label}</option>))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={showCables} onChange={(e) => setShowCables(e.target.checked)} />
          🔌 Câbles sous-marins
        </label>
      </div>

      <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>
          PIB vs. {INDICATORS.find(i => i.key === indicator)?.label || ""}
        </div>
        <ScatterPlot data={indicatorsData as any} xIndicator="gdp_per_capita" yIndicator={indicator} xLabel="PIB / habitant ($ US)" yLabel={INDICATORS.find(i => i.key === indicator)?.label || ""} />
      </div>
    </>
  );
}
