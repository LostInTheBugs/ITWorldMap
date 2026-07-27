import { useState, useMemo } from "react";
import Map from "./components/Map";
import type { MapMode } from "./components/Map";
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

const MODES: { key: MapMode; label: string; title: string }[] = [
  { key: "single", label: "1 carte", title: "Une carte, un indicateur" },
  { key: "dual", label: "2 cartes", title: "Deux cartes, un indicateur chacune" },
  { key: "ratio", label: "Ratio", title: "Une carte : ratio des deux indicateurs" },
];

export default function App() {
  const INDICATORS = useMemo(() => {
    const availableKeys = new Set(
      indicatorsData.flatMap((c) => Object.keys(c)).filter((k) => k !== "iso3" && !k.endsWith("_year")),
    );
    return ALL_INDICATORS.filter((ind) => availableKeys.has(ind.key));
  }, []);

  const firstKey = INDICATORS[0]?.key ?? "population";
  const secondKey = INDICATORS[1]?.key ?? firstKey;

  const [mode, setMode] = useState<MapMode>("single");
  const [indicatorA, setIndicatorA] = useState(firstKey);
  const [indicatorB, setIndicatorB] = useState(secondKey);
  const [showCables, setShowCables] = useState(false);

  const [xAxis, setXAxis] = useState(secondKey);
  const [yAxis, setYAxis] = useState(firstKey);

  const labelOf = (key: string) => INDICATORS.find((i) => i.key === key)?.label ?? "";
  const shortOf = (key: string) => INDICATORS.find((i) => i.key === key)?.short ?? "";

  const renderOptions = () =>
    INDICATORS.map((ind) => <option key={ind.key} value={ind.key}>{ind.label}</option>);

  // The secondary indicator is needed for both "dual" and "ratio"
  const needsB = mode === "dual" || mode === "ratio";

  return (
    <>
      <Map
        data={indicatorsData}
        indicatorA={indicatorA}
        labelA={labelOf(indicatorA)}
        shortA={shortOf(indicatorA)}
        indicatorB={indicatorB}
        labelB={labelOf(indicatorB)}
        shortB={shortOf(indicatorB)}
        showCables={showCables}
        mode={mode}
      />

      {/* Control panel — top left */}
      <div style={{ ...panelStyle, top: 10, left: 10, maxWidth: 290 }}>
        <h1 style={{ margin: "0 0 10px 0", fontSize: 16, fontWeight: 700 }}>🌍 ITWorldMap</h1>

        {/* Mode segmented control */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                title={m.title}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#fff" : "#374151",
                  background: active ? "#2563eb" : "#f3f4f6",
                  border: "1px solid " + (active ? "#2563eb" : "#d1d5db"),
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
          {mode === "dual" ? "Carte gauche" : mode === "ratio" ? "Numérateur" : "Indicateur"}
        </label>
        <select value={indicatorA} onChange={(e) => setIndicatorA(e.target.value)} style={selectStyle} aria-label="Indicateur principal">
          {renderOptions()}
        </select>

        {needsB && (
          <>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", display: "block", marginTop: 8 }}>
              {mode === "dual" ? "Carte droite" : "Dénominateur"}
            </label>
            <select value={indicatorB} onChange={(e) => setIndicatorB(e.target.value)} style={selectStyle} aria-label="Indicateur secondaire">
              {renderOptions()}
            </select>
          </>
        )}

        {mode === "dual" && (
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
            Zoom et déplacement synchronisés entre les deux cartes.
          </div>
        )}
        {mode === "ratio" && (
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
            Affiche {shortOf(indicatorA)} ÷ {shortOf(indicatorB)} par pays.
          </div>
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
