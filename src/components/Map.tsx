import { useEffect, useMemo, useCallback, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import type { PathOptions } from "leaflet";
import NoWrapTileLayer from "./NoWrapTileLayer";
import CableLayer from "./CableLayer";
import ColorLegend from "./ColorLegend";
import type { CountryData } from "../data/types";
interface Props { data: CountryData[]; indicator: string; showCables: boolean; }

const NAME_TO_ISO3: Record<string, string> = {
  France: "FRA",
  Norway: "NOR",
  Kosovo: "XKX",
};

const PALETTE = [
  "rgb(239,243,255)", "rgb(189,201,225)", "rgb(107,174,214)",
  "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,48,107)",
];

function getIso3(props: Record<string, unknown> | undefined): string | undefined {
  if (!props) return undefined;
  const iso3 = props["ISO3166-1-Alpha-3"] as string | undefined;
  if (iso3 && iso3 !== "-99") return iso3;
  const name = (props.ADMIN || props.name || "") as string;
  return NAME_TO_ISO3[name] || undefined;
}

function getQuantileColor(value: number, thresholds: number[]): string {
  for (let i = 0; i < thresholds.length; i++) if (value <= thresholds[i]) return PALETTE[i];
  return PALETTE[PALETTE.length - 1];
}

function fmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return n.toFixed(1);
}

export default function Map({ data, indicator, showCables }: Props) {
  const [geoData, setGeoData] = useState<unknown>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/countries.geojson")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setGeoData)
      .catch(() => setGeoError("Impossible de charger les frontières"));
  }, []);

  const valueMap = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((d) => { if (typeof d[indicator] === "number") map[d.iso3] = d[indicator] as number; });
    return map;
  }, [data, indicator]);

  const yearMap = useMemo(() => {
    const map: Record<string, string> = {};
    const yearKey = `${indicator}_year`;
    data.forEach((d) => {
      if (typeof d[yearKey] === "string") map[d.iso3] = d[yearKey] as string;
    });
    return map;
  }, [data, indicator]);

  const values = useMemo(() => Object.values(valueMap).sort((a, b) => a - b), [valueMap]);

  const thresholds = useMemo(() => {
    if (values.length === 0) return [0, 0, 0, 0, 0];
    const n = PALETTE.length;
    const t: number[] = [];
    for (let i = 1; i < n; i++) t.push(values[Math.floor((values.length * i) / n)] ?? values[values.length - 1]);
    return t;
  }, [values]);

  const style = useCallback((feature: unknown): PathOptions => {
    const props = (feature as { properties?: Record<string, unknown> })?.properties;
    const iso3 = getIso3(props);
    const value = iso3 ? valueMap[iso3] : undefined;
    return {
      fillColor: value !== undefined ? getQuantileColor(value, thresholds) : "#d4d4d4",
      weight: 1, opacity: 1, color: "#cccccc", fillOpacity: 0.85,
    };
  }, [valueMap, thresholds]);

  const onEachFeature = useCallback((feature: unknown, layer: L.Layer) => {
    const props = (feature as { properties?: Record<string, unknown> })?.properties;
    const iso3 = getIso3(props);
    const name = (props?.ADMIN || props?.name || "") as string;
    const value = iso3 ? valueMap[iso3] : undefined;
    const year = iso3 ? yearMap[iso3] : undefined;
    const formatted = value !== undefined ? fmt(value) : "N/A";
    const yearStr = year ? ` (${year})` : "";
    layer.bindTooltip(`${name}: ${formatted}${yearStr}`, { sticky: true });
  }, [valueMap, yearMap]);

  return (
    <>
      <MapContainer
        center={[20, 0]} zoom={2}
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#f0f0f0" }}
        zoomControl={true} scrollWheelZoom={true}
      >
        <NoWrapTileLayer />
        {geoError && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "white", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 2000 }}>
            {geoError}
          </div>
        )}
        {(geoData as boolean) && <GeoJSON data={geoData as GeoJSON.GeoJsonObject} style={style} onEachFeature={onEachFeature} />}
        <CableLayer visible={showCables} />
      </MapContainer>
      <ColorLegend palette={PALETTE} thresholds={thresholds} values={values} />
    </>
  );
}
