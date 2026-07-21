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

  return (
    <div className="h-screen w-screen relative">
      {/* Carte plein écran */}
      <Map data={indicatorsData as any} indicator={indicator} />

      {/* Overlay : titre + sélecteur (haut gauche) */}
      <div className="absolute top-4 left-4 z-[1000] bg-gray-900/90 backdrop-blur rounded-lg shadow-lg p-3 text-white max-w-[260px]">
        <h1 className="text-base font-bold mb-2">🌍 ITWorldMap</h1>
        <select
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          value={indicator}
          onChange={(e) => setIndicator(e.target.value)}
        >
          {INDICATORS.map((ind) => (
            <option key={ind.key} value={ind.key}>
              {ind.label}
            </option>
          ))}
        </select>
      </div>

      {/* Overlay : scatter plot (bas gauche) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 backdrop-blur rounded-lg shadow-lg p-3 text-white">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          PIB vs. {INDICATORS.find((i) => i.key === indicator)?.label || ""}
        </h2>
        <ScatterPlot
          data={indicatorsData as any}
          xIndicator="gdp_per_capita"
          yIndicator={indicator}
          xLabel="PIB / habitant ($ US)"
          yLabel={INDICATORS.find((i) => i.key === indicator)?.label || ""}
        />
      </div>
    </div>
  );
}
