import { useState, useMemo } from "react";
import Map from "./components/Map";
import ScatterPlot from "./components/ScatterPlot";
import indicatorsRaw from "./data/indicators.json";
import type { CountryData } from "./data/types";

const indicatorsData = indicatorsRaw as CountryData[];

const ALL_INDICATORS: { key: string; label: string; short: string }[] = [
  { key: "population", label: "👥 Population", short: "Population" },
  { key: "gdp_per_capita", label: "💰 PIB / habitant ($ US)", short: "PIB / hab." },
  { key: "co2_per_capita", label: "🏭 CO₂ / habitant (tonnes)", short: "CO₂ / hab." },
  { key: "internet_users_pct", label: "🌐 Utilisateurs Internet (%)", short: "Internet %" },
  { key: "mobile_subscriptions_per100", label: "📱 Abonnements mobiles /100 hab.", short: "Mobile /100" },
  { key: "fixed_broadband_per100", label: "🛜 Haut débit fixe /100 hab.", short: "Haut débit /100" },
  { key: "electricity_access_pct", label: "⚡ Accès électricité (%)", short: "Électricité %" },
  { key: "secure_servers_per_million", label: "🔒 Serveurs sécurisés /M hab.", short: "Serveurs séc." },
];

const panelStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 1000,
  background: "rgba(255,255,255,0.92)",
  borderRadius: 8,
  padding: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 13,
  outline: "none",
  marginTop: 4,
};

export default function App() {
  // Indicators actually present in the data
  const INDICATORS = useMemo(() => {
    const availableKeys = new Set(
      indicatorsData.flatMap((c) => Object.keys(c)).filter((k) => k !== "iso3" && !k.endsWith("_year")),
    );
    return ALL_INDICATORS.filter((ind) => availableKeys.has(ind.key));
  }, []);

  const firstKey = INDICATORS[0]?.key ?? "population";
  const secondKey = INDICATORS[1]?.key ?? firstKey;

  const [indicatorA, setIndicatorA] = useState(firstKey);
  const [indicatorB, setIndicatorB] = useState(secondKey);
  const [split, setSplit] = useState(false);
  const [showCables, setShowCables] = useState(false);

  // Scatter axes — fully free among available indicators
  const [xAxis, setXAxis] = useState(secondKey);
  const [yAxis, setYAxis] = useState(firstKey);

  const labelOf = (key: string) => INDICATORS.find((i) => i.key === key)?.label ?? "";
  const shortOf = (key: string) => INDICATORS.find((i) => i.key === key)?.short ?? "";

  const renderOptions = () =>
    INDICATORS.map((ind) => (
      <option key={ind.key} value={ind.key}>{ind.label}</option>
    ));

  return (
    <>
      <Map
        data={indicatorsData}
        indicatorA={indicatorA}
        labelA={labelOf(indicatorA)}
        indicatorB={indicatorB}
        labelB={labelOf(indicatorB)}
        showCables={showCables}
        split={split}
      />

      {/* Control panel — top left */}
      <div style={{ ...panelStyle, top: 10, left: 10, maxWidth: 280 }}>
        <h1 style={{ margin: "0 0 10px 0", fontSize: 16, fontWeight: 700 }}>🌍 ITWorldMap</h1>

        <label style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
          {split ? "Carte gauche" : "Carte"}
        </label>
        <select value={indicatorA} onChange={(e) => setIndicatorA(e.target.value)} style={selectStyle} aria-label="Indicateur de la carte principale">
          {renderOptions()}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
          🗺️ Comparer deux cartes
        </label>

        {split && (
          <>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", display: "block", marginTop: 8 }}>
              Carte droite
            </label>
            <select value={indicatorB} onChange={(e) => setIndicatorB(e.target.value)} style={selectStyle} aria-label="Indicateur de la carte secondaire">
              {renderOptions()}
            </select>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
              Les deux cartes sont synchronisées (zoom/déplacement).
            </div>
          </>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={showCables} onChange={(e) => setShowCables(e.target.checked)} />
          🔌 Câbles sous-marins
        </label>
      </div>

      {/* Scatter panel — bottom left */}
      <div style={{ ...panelStyle, bottom: 10, left: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 6 }}>
          Corrélation : {shortOf(xAxis)} vs. {shortOf(yAxis)}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} style={{ ...selectStyle, marginTop: 0, fontSize: 11, padding: "4px 6px" }} aria-label="Axe X du graphique">
            {renderOptions()}
          </select>
          <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} style={{ ...selectStyle, marginTop: 0, fontSize: 11, padding: "4px 6px" }} aria-label="Axe Y du graphique">
            {renderOptions()}
          </select>
        </div>
        <ScatterPlot
          data={indicatorsData}
          xIndicator={xAxis}
          yIndicator={yAxis}
          xLabel={shortOf(xAxis)}
          yLabel={shortOf(yAxis)}
        />
      </div>
    </>
  );
}
