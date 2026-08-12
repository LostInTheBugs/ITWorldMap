import { useEffect, useMemo, useCallback } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl } from "react-leaflet";
import type { PathOptions } from "leaflet";
import type L from "leaflet";
import NoWrapTileLayer from "./NoWrapTileLayer";
import CableLayer from "./CableLayer";
import ColorLegend from "./ColorLegend";
import type { CountryData } from "../data/types";
import type { MapFocus } from "./Map";
import { fmt } from "../utils/format";

interface Props {
  data: CountryData[];
  label: string;
  valueFn: (d: CountryData) => number | undefined;
  yearFn?: (d: CountryData) => string | undefined;
  showCables: boolean;
  geoData: GeoJSON.GeoJsonObject | null;
  syncGroup?: React.MutableRefObject<L.Map[]>;
  showZoomControl?: boolean;
  resetToken?: number;
  focus?: MapFocus | null;
  selectedIso3?: string | null;
  onSelectCountry?: (iso3: string) => void;
  indicatorKey?: string;
  secondaryKey?: string;
  secondaryLabel?: string;
  t: (key: string, vars?: Record<string, string>) => string;
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ResizeController() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const raf = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
  }, [map]);
  return null;
}

function ViewController({ token, focus }: { token: number; focus?: MapFocus | null }) {
  const map = useMap();
  useEffect(() => {
    if (token > 0) map.setView([20, 0], 2, { animate: false });
  }, [token, map]);
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 1.2 });
  }, [focus, map]);
  return null;
}

function SyncController({ syncGroup }: { syncGroup?: React.MutableRefObject<L.Map[]> }) {
  const map = useMap();
  useEffect(() => {
    if (!syncGroup) return;
    const group = syncGroup.current;
    group.push(map);
    const self = map as L.Map & { _syncing?: boolean };

    const propagate = () => {
      if (self._syncing) return;
      const c = map.getCenter();
      const z = map.getZoom();
      group.forEach((other) => {
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
      const idx = group.indexOf(map);
      if (idx !== -1) group.splice(idx, 1);
    };
  }, [map, syncGroup]);
  return null;
}

export default function MapPanel({
  data, label, valueFn, yearFn, showCables, geoData, syncGroup, showZoomControl = true,
  resetToken = 0, focus, selectedIso3, onSelectCountry, indicatorKey, secondaryKey, secondaryLabel, t,
}: Props) {
  const valueMap = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((d) => {
      const v = valueFn(d);
      if (typeof v === "number" && isFinite(v)) map[d.iso3] = v;
    });
    return map;
  }, [data, valueFn]);

  const yearMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!yearFn) return map;
    data.forEach((d) => {
      const y = yearFn(d);
      if (typeof y === "string") map[d.iso3] = y;
    });
    return map;
  }, [data, yearFn]);

  const secondaryMap = useMemo(() => {
    const map: Record<string, { v: number; y?: string }> = {};
    if (!secondaryKey) return map;
    data.forEach((d) => {
      const v = d[secondaryKey];
      if (typeof v === "number" && isFinite(v)) {
        const y = d[`${secondaryKey}_year`];
        map[d.iso3] = { v, y: typeof y === "string" ? y : undefined };
      }
    });
    return map;
  }, [data, secondaryKey]);

  const values = useMemo(() => Object.values(valueMap).sort((a, b) => a - b), [valueMap]);

  const rankMap = useMemo(() => {
    const ranks: Record<string, number> = {};
    Object.entries(valueMap)
      .sort((a, b) => b[1] - a[1])
      .forEach(([iso3], i) => { ranks[iso3] = i + 1; });
    return ranks;
  }, [valueMap]);

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
    const selected = iso3 !== undefined && iso3 === selectedIso3;
    return {
      fillColor: value !== undefined ? getQuantileColor(value, thresholds) : "#d4d4d4",
      weight: selected ? 3 : 1,
      opacity: 1,
      color: selected ? "#2563eb" : "#cccccc",
      fillOpacity: 0.85,
    };
  }, [valueMap, thresholds, selectedIso3]);

  const onEachFeature = useCallback((feature: unknown, layer: L.Layer) => {
    const props = (feature as { properties?: Record<string, unknown> })?.properties;
    const iso3 = getIso3(props);
    const name = (props?.ADMIN || props?.name || "") as string;
    const value = iso3 ? valueMap[iso3] : undefined;
    const year = iso3 ? yearMap[iso3] : undefined;
    const rank = iso3 ? rankMap[iso3] : undefined;
    const formatted = value !== undefined ? fmt(value) : t("map.na");
    const yearStr = year ? ` (${year})` : "";
    const rankStr = rank ? ` · #${rank}/${values.length}` : "";
    const lines = [`<b>${escapeHtml(name)}</b>${rankStr}`, `${escapeHtml(label)} : ${escapeHtml(formatted)}${yearStr}`];
    if (secondaryKey && secondaryLabel && secondaryKey !== indicatorKey && iso3) {
      const sec = secondaryMap[iso3];
      if (sec) lines.push(`${escapeHtml(secondaryLabel)} : ${escapeHtml(fmt(sec.v))}${sec.y ? ` (${sec.y})` : ""}`);
    }
    layer.bindTooltip(lines.join("<br>"), { sticky: true, className: "itwm-tooltip" });
    if (iso3 && onSelectCountry) {
      layer.on("click", () => onSelectCountry(iso3));
    }
  }, [valueMap, yearMap, rankMap, values.length, label, t, secondaryKey, secondaryLabel, indicatorKey, secondaryMap, onSelectCountry]);

  const geoKey = `${label}-${thresholds.join(",")}`;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MapContainer
        center={[20, 0]} zoom={2}
        style={{ height: "100%", width: "100%", background: "#f0f0f0" }}
        zoomControl={false} scrollWheelZoom={true}
      >
        <NoWrapTileLayer />
        <ResizeController />
        <SyncController syncGroup={syncGroup} />
        {showZoomControl && <ZoomControl position="topright" />}
        <ViewController token={resetToken} focus={focus} />
        {geoData && (
          <GeoJSON key={geoKey} data={geoData} style={style} onEachFeature={onEachFeature} />
        )}
        <CableLayer visible={showCables} />
      </MapContainer>
      <ColorLegend palette={PALETTE} thresholds={thresholds} values={values} title={label} t={t} />
    </div>
  );
}
