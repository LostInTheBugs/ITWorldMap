import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type L from "leaflet";
import MapPanel from "./MapPanel";
import type { CountryData } from "../data/types";
import type { CountryEntry } from "../utils/countries";
import { seriesValue, type YearSeries } from "../utils/series";
import type { ScaleMode } from "../utils/scale";
import centroids from "../data/centroids.json";

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
  year?: number | null;
  yearB?: number | null;
  series?: YearSeries | null;
  scaleMode?: ScaleMode;
  customThresholds?: string;
  compareIso3?: string | null;
  isMobile?: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
}

export default function Map({
  data, indicatorA, labelA, shortA, indicatorB, labelB, shortB, showCables, mode,
  resetToken, focus, selectedIso3, onSelectCountry, onIndexReady, secondaryKey, secondaryLabel,
  year, yearB, series, scaleMode, customThresholds, compareIso3, isMobile = false, t,
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
      // Table de centroïdes calculée sur le GeoJSON ORIGINAL (le fichier simplifié
      // par mapshaper a des géométries invalides pour les multipolygones → aires ~4π)
      const centroid = (centroids as unknown as Record<string, [number, number]>)[iso3] ?? mainCentroid(f as GeoJSON.Feature);
      index[iso3] = { iso3, name, lat: centroid[1], lng: centroid[0] };
    });
    indexSent.current = true;
    onIndexReady(index);
  }, [geoData, onIndexReady]);

  /**
   * Centroïde du polygone PRINCIPAL (le plus grand en surface) pour les
   * MultiPolygon. Le centroïde global de toute la géométrie est inutilisable :
   * ex. France (Guyane/Polynésie), USA (Alaska/Hawaï), Chili (îles du Pacifique),
   * Russie → le point tombe dans l'océan et le flyTo « zoome dans le vide ».
   */
  function mainCentroid(feature: GeoJSON.Feature): [number, number] {
    const g = feature.geometry;
    if (g && g.type === "MultiPolygon") {
      let best: [number, number] | null = null;
      let bestArea = -1;
      for (const coords of g.coordinates) {
        const poly: GeoJSON.Geometry = { type: "Polygon", coordinates: coords };
        const area = d3.geoArea(poly as unknown as GeoJSON.Feature);
        if (area > bestArea) {
          bestArea = area;
          best = d3.geoCentroid(poly as unknown as GeoJSON.Feature);
        }
      }
      if (best) return best;
    }
    return d3.geoCentroid(feature);
  }

  const valueA = useMemo(() => (d: CountryData) => {
    if (year != null && series) {
      const s = seriesValue(series, indicatorA, d.iso3, year);
      if (s !== undefined) return s;
      return undefined;
    }
    const v = d[indicatorA];
    return typeof v === "number" ? v : undefined;
  }, [indicatorA, year, series]);

  // Année de la carte B : propre au mode dual (sinon suit la carte A)
  const effYearB = year != null && yearB != null ? yearB : year;

  const valueB = useMemo(() => (d: CountryData) => {
    if (effYearB != null && series) {
      const s = seriesValue(series, indicatorB, d.iso3, effYearB);
      if (s !== undefined) return s;
      return undefined;
    }
    const v = d[indicatorB];
    return typeof v === "number" ? v : undefined;
  }, [indicatorB, effYearB, series]);

  const valueRatio = useMemo(() => (d: CountryData) => {
    let a: number | undefined;
    let b: number | undefined;
    if (year != null && series) {
      a = seriesValue(series, indicatorA, d.iso3, year);
      b = seriesValue(series, indicatorB, d.iso3, year);
    } else {
      const av = d[indicatorA];
      const bv = d[indicatorB];
      a = typeof av === "number" ? av : undefined;
      b = typeof bv === "number" ? bv : undefined;
    }
    if (a !== undefined && b !== undefined && b !== 0) return a / b;
    return undefined;
  }, [indicatorA, indicatorB, year, series]);

  const yearA = useMemo(() => (d: CountryData) => {
    if (year != null && series) {
      const s = seriesValue(series, indicatorA, d.iso3, year);
      return s !== undefined ? String(year) : undefined;
    }
    const y = d[`${indicatorA}_year`];
    return typeof y === "string" ? y : undefined;
  }, [indicatorA, year, series]);

  const yearBFn = useMemo(() => (d: CountryData) => {
    if (effYearB != null && series) {
      const s = seriesValue(series, indicatorB, d.iso3, effYearB);
      return s !== undefined ? String(effYearB) : undefined;
    }
    const y = d[`${indicatorB}_year`];
    return typeof y === "string" ? y : undefined;
  }, [indicatorB, effYearB, series]);

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
    compareIso3,
    onSelectCountry,
    secondaryKey,
    secondaryLabel,
    year,
    series,
    scaleMode,
    customThresholds,
    t,
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: isMobile ? "column" : "row" }} className="itwm-capture">
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
          <div style={{ flex: 1, position: "relative", borderTop: isMobile ? "3px solid #fff" : "none", borderLeft: isMobile ? "none" : "3px solid #fff" }}>
            <MapPanel
              {...panelProps}
              label={labelB}
              valueFn={valueB}
              yearFn={yearBFn}
              year={effYearB}
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
