import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type L from "leaflet";
import MapPanel from "./MapPanel";
import type { CountryData } from "../data/types";
import type { CountryEntry } from "../utils/countries";

export type MapMode = "single" | "dual" | "ratio";

export interface MapFocus {
  lat: number;
  lng: number;
  zoom: number;
}

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
  resetToken?: number;
  focus?: MapFocus | null;
  selectedIso3?: string | null;
  onSelectCountry?: (iso3: string) => void;
  onIndexReady?: (index: Record<string, CountryEntry>) => void;
  secondaryKey?: string;
  secondaryLabel?: string;
  t: (key: string, vars?: Record<string, string>) => string;
}

export default function Map({
  data, indicatorA, labelA, shortA, indicatorB, labelB, shortB, showCables, mode,
  resetToken, focus, selectedIso3, onSelectCountry, onIndexReady, secondaryKey, secondaryLabel, t,
}: Props) {
  const [geoData, setGeoData] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [geoError, setGeoError] = useState(false);
  const syncGroup = useRef<L.Map[]>([]);
  const indexSent = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/countries.geojson")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((g) => { if (!cancelled) setGeoData(g); })
      .catch(() => { if (!cancelled) setGeoError(true); });
    return () => { cancelled = true; };
  }, []);

  // Construit l'index pays (nom + centroïde) pour la recherche et le focus
  useEffect(() => {
    if (!geoData || !onIndexReady || indexSent.current) return;
    const fc = geoData as GeoJSON.FeatureCollection;
    const index: Record<string, CountryEntry> = {};
    fc.features.forEach((f) => {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      let iso3 = props["ISO3166-1-Alpha-3"] as string | undefined;
      if (!iso3 || iso3 === "-99") {
        const name = (props.ADMIN || props.name || "") as string;
        const fallback: Record<string, string> = { France: "FRA", Norway: "NOR", Kosovo: "XKX" };
        iso3 = fallback[name];
        if (!iso3) return;
      }
      if (index[iso3]) return;
      const name = (props.ADMIN || props.name || "") as string;
      const c = d3.geoCentroid(f as GeoJSON.Feature);
      index[iso3] = { iso3, name, lat: c[1], lng: c[0] };
    });
    indexSent.current = true;
    onIndexReady(index);
  }, [geoData, onIndexReady]);

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
          ⚠️ {t("map.geoerror")}
        </div>
      </div>
    );
  }

  const dual = mode === "dual";

  const panelProps = {
    data,
    showCables,
    geoData,
    syncGroup: dual ? syncGroup : undefined,
    resetToken,
    focus,
    selectedIso3,
    onSelectCountry,
    secondaryKey,
    secondaryLabel,
    t,
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, display: "flex" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <MapPanel
            {...panelProps}
            label={mode === "ratio" ? `${shortA} / ${shortB}` : labelA}
            valueFn={mode === "ratio" ? valueRatio : valueA}
            yearFn={mode === "ratio" ? undefined : yearA}
            indicatorKey={indicatorA}
            showZoomControl={true}
          />
        </div>
        {dual && (
          <div style={{ flex: 1, position: "relative", borderLeft: "3px solid #fff" }}>
            <MapPanel
              {...panelProps}
              label={labelB}
              valueFn={valueB}
              yearFn={yearB}
              indicatorKey={indicatorB}
              showZoomControl={false}
            />
          </div>
        )}
      </div>
      {!geoData && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.55)", zIndex: 1500, pointerEvents: "none" }}>
          <div style={{ background: "rgba(255,255,255,0.95)", padding: "12px 20px", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 14, color: "#374151" }}>
            ⏳ {t("map.loading")}
          </div>
        </div>
      )}
    </>
  );
}
