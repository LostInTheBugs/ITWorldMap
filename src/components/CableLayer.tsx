import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import type { PathOptions } from "leaflet";

interface Props { visible: boolean; }

export default function CableLayer({ visible }: Props) {
  const [geoData, setGeoData] = useState<unknown>(null);
  useEffect(() => {
    if (visible && !geoData) fetch("/cables.geo.json").then(r => r.json()).then(setGeoData).catch(() => {});
  }, [visible, geoData]);
  if (!visible || !geoData) return null;
  const style = (f: unknown): PathOptions => ({
    color: (f as { properties?: { color?: string } })?.properties?.color || "#00d4ff",
    weight: 1.5, opacity: 0.6,
  });
  const onEach = (f: unknown, l: L.Layer) => {
    const name = (f as { properties?: { name?: string } })?.properties?.name || "";
    l.bindTooltip(`🔌 ${name}`, { sticky: true });
  };
  return <GeoJSON data={geoData as GeoJSON.GeoJsonObject} style={style} onEachFeature={onEach} />;
}
