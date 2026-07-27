import { useEffect, useRef, useState, useMemo } from "react";
import type L from "leaflet";
import MapPanel from "./MapPanel";
import type { CountryData } from "../data/types";

export type MapMode = "single" | "dual" | "ratio";

interface Props {
  data: CountryData[];
  indicatorA: string;
  labelA: string;
  shortA: string;
  indicatorB: string;
  labelB: string;
  shortB: string;
  showCables: boolean;
  mode: MapMode;
}

export default function Map({
  data, indicatorA, labelA, shortA, indicatorB, labelB, shortB, showCables, mode,
}: Props) {
  const [geoData, setGeoData] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const syncGroup = useRef<L.Map[]>([]);

  useEffect(() => {
    fetch("/countries.geojson")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setGeoData)
      .catch(() => setGeoError("Impossible de charger les frontières"));
  }, []);
  // Note: no manual reset of syncGroup — SyncController registers/unregisters
  // each map itself. Resetting here would wipe the group AFTER children mount.

  // Value accessors
  const valueA = useMemo(() => (d: CountryData) => {
    const v = d[indicatorA];
    return typeof v === "number" ? v : undefined;
  }, [indicatorA]);

  const valueB = useMemo(() => (d: CountryData) => {
    const v = d[indicatorB];
    return typeof v === "number" ? v : undefined;
  }, [indicatorB]);

  const valueRatio = useMemo(() => (d: CountryData) => {
    const a = d[indicatorA];
    const b = d[indicatorB];
    if (typeof a === "number" && typeof b === "number" && b !== 0) return a / b;
    return undefined;
  }, [indicatorA, indicatorB]);

  const yearA = useMemo(() => (d: CountryData) => {
    const y = d[`${indicatorA}_year`];
    return typeof y === "string" ? y : undefined;
  }, [indicatorA]);

  const yearB = useMemo(() => (d: CountryData) => {
    const y = d[`${indicatorB}_year`];
    return typeof y === "string" ? y : undefined;
  }, [indicatorB]);

  if (geoError) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0", zIndex: 2000 }}>
        <div style={{ background: "white", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          ⚠️ {geoError}
        </div>
      </div>
    );
  }

  const dual = mode === "dual";

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <MapPanel
          data={data}
          label={mode === "ratio" ? `${shortA} / ${shortB}` : labelA}
          valueFn={mode === "ratio" ? valueRatio : valueA}
          yearFn={mode === "ratio" ? undefined : yearA}
          showCables={showCables}
          geoData={geoData}
          syncGroup={dual ? syncGroup : undefined}
          showZoomControl={true}
        />
      </div>
      {dual && (
        <div style={{ flex: 1, position: "relative", borderLeft: "3px solid #fff" }}>
          <MapPanel
            data={data}
            label={labelB}
            valueFn={valueB}
            yearFn={yearB}
            showCables={showCables}
            geoData={geoData}
            syncGroup={syncGroup}
            showZoomControl={false}
          />
        </div>
      )}
    </div>
  );
}
