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
    <div className="h-screen w-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 text-white p-4 flex flex-col gap-3 overflow-y-auto shrink-0">
        <h1 className="text-xl font-bold">🌍 ITWorldMap</h1>
        <p className="text-sm text-gray-400">
          Indicateurs IT & socio-économiques par pays
        </p>

        <h2 className="text-xs font-semibold mt-3 text-gray-500 uppercase tracking-wider">
          Indicateur
        </h2>
        <select
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          value={indicator}
          onChange={(e) => setIndicator(e.target.value)}
        >
          {INDICATORS.map((ind) => (
            <option key={ind.key} value={ind.key}>
              {ind.label}
            </option>
          ))}
        </select>

        <hr className="border-gray-700 my-2" />

        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Corrélation PIB vs.
        </h2>
        <ScatterPlot
          data={indicatorsData as any}
          xIndicator="gdp_per_capita"
          yIndicator={indicator}
          xLabel="PIB / habitant ($ US)"
          yLabel={INDICATORS.find((i) => i.key === indicator)?.label || ""}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map data={indicatorsData as any} indicator={indicator} />
      </div>
    </div>
  );
}
