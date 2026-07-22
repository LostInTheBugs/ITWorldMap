import { useEffect, useMemo, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import type { PathOptions } from "leaflet";
import ColorLegend from "./ColorLegend";
import CableLayer from "./CableLayer";
import NoWrapTileLayer from "./NoWrapTileLayer";

interface CountryData {
  iso3: string;
  [key: string]: number | string;
}

interface Props {
  data: CountryData[];
  indicator: string;
  showCables: boolean;
}

const NAME_TO_ISO3: Record<string, string> = {
  "France": "FRA",
  "Norway": "NOR",
  "Kosovo": "XKX",
  "Somaliland": "SOM",
  "Northern Cyprus": "CYP",
  "Western Sahara": "ESH",
};

function getIso3(feature: any): string | undefined {
  const props = feature?.properties;
  if (!props) return undefined;
  const iso3 = props["ISO3166-1-Alpha-3"];
  if (iso3 && iso3 !== "-99") return iso3;
  const name = props.ADMIN || props.name || "";
  return NAME_TO_ISO3[name] || undefined;
}

const PALETTE = [
  "rgb(239,243,255)", "rgb(189,201,225)", "rgb(107,174,214)",
  "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,48,107)",
];

function getQuantileColor(value: number, thresholds: number[]): string {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return PALETTE[i];
  }
  return PALETTE[PALETTE.length - 1];
}

export default function Map({ data, indicator, showCables }: Props) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
      .then((r) => r.json())
      .then(setGeoData);
  }, []);

  const valueMap: Record<string, number> = {};
  data.forEach((d) => {
    if (typeof d[indicator] === "number") {
      valueMap[d.iso3] = d[indicator] as number;
    }
  });

  const values = Object.values(valueMap).sort((a, b) => a - b);
  const N = PALETTE.length;

  const thresholds = useMemo(() => {
    if (values.length === 0) return [0, 0, 0, 0, 0];
    const t: number[] = [];
    for (let i = 1; i < N; i++) {
      const idx = Math.floor((values.length * i) / N);
      t.push(values[Math.min(idx, values.length - 1)]);
    }
    return t;
  }, [values]);

  const style = (feature: any): PathOptions => {
    const iso3 = getIso3(feature);
    const value = iso3 ? valueMap[iso3] : undefined;
    return {
      fillColor: value !== undefined ? getQuantileColor(value, thresholds) : "#d4d4d4",
      weight: 1,
      opacity: 1,
      color: "#444444",
      fillOpacity: 0.85,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const iso3 = getIso3(feature);
    const name = feature?.properties?.ADMIN || feature?.properties?.name || "";
    const value = iso3 ? valueMap[iso3] : undefined;
    const formatted =
      value !== undefined
        ? value >= 1e6 ? `${(value / 1e6).toFixed(1)}M`
        : value >= 1e3 ? `${(value / 1e3).toFixed(0)}k`
        : value.toFixed(1)
        : "N/A";
    layer.bindTooltip(`${name}: ${formatted}`, { sticky: true });
  };

  return (
    <>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#f0f0f0" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <NoWrapTileLayer />
        {geoData && (
          <GeoJSON data={geoData} style={style} onEachFeature={onEachFeature} />
        )}
        <CableLayer visible={showCables} />
      </MapContainer>
      <ColorLegend palette={PALETTE} thresholds={[0, ...thresholds]} values={values} />
    </>
  );
}
