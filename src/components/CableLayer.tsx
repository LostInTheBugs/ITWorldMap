import { useEffect, useState } from "react";
import { GeoJSON, Pane } from "react-leaflet";
import type { PathOptions } from "leaflet";
import * as d3 from "d3";

interface Props { visible: boolean; }

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Longueur géodésique approximative du câble (km), sommée sur tous les segments. */
function cableLengthKm(f: unknown): number | null {
  const coords = (f as { geometry?: { coordinates?: number[][][] } })?.geometry?.coordinates;
  if (!Array.isArray(coords)) return null;
  let total = 0;
  for (const line of coords) {
    for (let i = 1; i < line.length; i++) total += d3.geoDistance(line[i - 1] as [number, number], line[i] as [number, number]);
  }
  return total * 6371;
}

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
    const len = cableLengthKm(f);
    l.bindPopup(
      `<div style="font-size:12px;min-width:170px;line-height:1.5">
        <b>🔌 ${escapeHtml(name)}</b><br/>
        <span style="color:#6b7280">Longueur : ${len != null ? `${Math.round(len).toLocaleString("fr-FR")} km (approx.)` : "—"}</span>
      </div>`,
      { maxWidth: 260 },
    );
  };
  // Pane dédié (zIndex 500 > overlayPane 400) : le SVG des pays est remonté par
  // react-leaflet quand geoKey change et passerait sinon AU-DESSUS des câbles,
  // rendant leurs clics/popups inaccessibles.
  return (
    <Pane name="cables-pane" style={{ zIndex: 500 }}>
      <GeoJSON data={geoData as GeoJSON.GeoJsonObject} style={style} onEachFeature={onEach} />
    </Pane>
  );
}
