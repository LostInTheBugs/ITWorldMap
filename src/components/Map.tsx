import { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import type { PathOptions } from "leaflet";
import ColorLegend from "./ColorLegend";

interface CountryData {
  iso3: string;
  [key: string]: number | string;
}

interface Props {
  data: CountryData[];
  indicator: string;
}

function getColor(value: number, min: number, max: number): string {
  if (max === min) return "#3388ff";
  const ratio = (value - min) / (max - min);
  const r = Math.floor(255 * (1 - ratio));
  const g = Math.floor(100 + 100 * ratio);
  const b = Math.floor(255 * ratio);
  return `rgb(${r},${g},${b})`;
}

export default function Map({ data, indicator }: Props) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
    )
      .then((r) => r.json())
      .then(setGeoData);
  }, []);

  const valueMap: Record<string, number> = {};
  data.forEach((d) => {
    if (typeof d[indicator] === "number") {
      valueMap[d.iso3] = d[indicator] as number;
    }
  });

  const values = Object.values(valueMap);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;

  const style = (feature: any): PathOptions => {
    const iso3 = feature?.properties?.ISO_A3;
    const value = iso3 ? valueMap[iso3] : undefined;
    return {
      fillColor:
        value !== undefined ? getColor(value, min, max) : "#2a2a2a",
      weight: 1,
      opacity: 1,
      color: "#444444",
      fillOpacity: 0.85,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const iso3 = feature?.properties?.ISO_A3;
    const name =
      feature?.properties?.ADMIN || feature?.properties?.name || "";
    const value = iso3 ? valueMap[iso3] : undefined;
    const formatted =
      value !== undefined
        ? value >= 1e6
          ? `${(value / 1e6).toFixed(1)}M`
          : value >= 1e3
          ? `${(value / 1e3).toFixed(0)}k`
          : value.toFixed(1)
        : "N/A";
    layer.bindTooltip(`${name}: ${formatted}`, { sticky: true });
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {geoData && (
          <GeoJSON
            data={geoData}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      <ColorLegend min={min} max={max} getColor={getColor} />
    </div>
  );
}
