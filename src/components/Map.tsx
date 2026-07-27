import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import MapPanel from "./MapPanel";
import type { CountryData } from "../data/types";

interface Props {
  data: CountryData[];
  indicatorA: string;
  labelA: string;
  indicatorB: string;
  labelB: string;
  showCables: boolean;
  split: boolean;
}

export default function Map({ data, indicatorA, labelA, indicatorB, labelB, showCables, split }: Props) {
  const [geoData, setGeoData] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const syncGroup = useRef<L.Map[]>([]);

  // Fetch borders once, shared by both panels (14 MB file — never load twice)
  useEffect(() => {
    fetch("/countries.geojson")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setGeoData)
      .catch(() => setGeoError("Impossible de charger les frontières"));
  }, []);

  // Reset sync group each time we toggle split, to avoid stale map refs
  useEffect(() => { syncGroup.current = []; }, [split]);

  if (geoError) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0", zIndex: 2000 }}>
        <div style={{ background: "white", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          ⚠️ {geoError}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <MapPanel
          data={data}
          indicator={indicatorA}
          label={labelA}
          showCables={showCables}
          geoData={geoData}
          syncGroup={split ? syncGroup : undefined}
        />
      </div>
      {split && (
        <div style={{ flex: 1, position: "relative", borderLeft: "3px solid #fff" }}>
          <MapPanel
            data={data}
            indicator={indicatorB}
            label={labelB}
            showCables={showCables}
            geoData={geoData}
            syncGroup={syncGroup}
          />
        </div>
      )}
    </div>
  );
}
