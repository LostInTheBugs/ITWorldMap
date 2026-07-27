import { useEffect, useMemo, useCallback } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import type { PathOptions } from "leaflet";
import type L from "leaflet";
import NoWrapTileLayer from "./NoWrapTileLayer";
import CableLayer from "./CableLayer";
import ColorLegend from "./ColorLegend";
import type { CountryData } from "../data/types";

interface Props {
  data: CountryData[];
  indicator: string;
  label: string;
  showCables: boolean;
  geoData: GeoJSON.GeoJsonObject | null;
  syncGroup?: React.MutableRefObject<L.Map[]>;
}

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

/** Keeps multiple Leaflet maps in sync (pan/zoom). No-op when no syncGroup. */
function SyncController({ syncGroup }: { syncGroup?: React.MutableRefObject<L.Map[]> }) {
  const map = useMap();
  useEffect(() => {
    if (!syncGroup) return;
    syncGroup.current.push(map);
    const propagate = () => {
      const self = map as L.Map & { _syncing?: boolean };
      if (self._syncing) return;
      const c = map.getCenter();
      const z = map.getZoom();
      syncGroup.current.forEach((other) => {
        if (other === map) return;
        const o = other as L.Map & { _syncing?: boolean };
        o._syncing = true;
        other.setView(c, z, { animate: false });
        o._syncing = false;
      });
    };
    map.on("move", propagate);
    map.on("zoom", propagate);
    return () => {
      map.off("move", propagate);
      map.off("zoom", propagate);
      if (syncGroup.current) syncGroup.current = syncGroup.current.filter((m) => m !== map);
    };
  }, [map, syncGroup]);
  return null;
}

export default function MapPanel({ data, indicator, label, showCables, geoData, syncGroup }: Props) {
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
    layer.bindTooltip(`${name}: ${formatted}${yearStr} — ${label}`, { sticky: true });
  }, [valueMap, yearMap, label]);

  // Unique key forces GeoJSON layer to restyle when indicator changes
  const geoKey = `${indicator}-${thresholds.join(",")}`;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MapContainer
        center={[20, 0]} zoom={2}
        style={{ height: "100%", width: "100%", background: "#f0f0f0" }}
        zoomControl={true} scrollWheelZoom={true}
      >
        <NoWrapTileLayer />
        <SyncController syncGroup={syncGroup} />
        {geoData && (
          <GeoJSON key={geoKey} data={geoData} style={style} onEachFeature={onEachFeature} />
        )}
        <CableLayer visible={showCables} />
      </MapContainer>
      <ColorLegend palette={PALETTE} thresholds={thresholds} values={values} title={label} />
    </div>
  );
}
