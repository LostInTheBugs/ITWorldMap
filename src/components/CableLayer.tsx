import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import type { PathOptions } from "leaflet";

const CABLES_URL = "/cables.geo.json";

interface Props {
  visible: boolean;
}

export default function CableLayer({ visible }: Props) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    if (visible && !geoData) {
      fetch(CABLES_URL)
        .then((r) => r.json())
        .then(setGeoData)
        .catch(() => {});
    }
  }, [visible, geoData]);

  if (!visible || !geoData) return null;

  const style = (feature: any): PathOptions => {
    const color = feature?.properties?.color || "#00d4ff";
    return {
      color,
      weight: 1.5,
      opacity: 0.6,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature?.properties?.name || "";
    layer.bindTooltip(`🔌 ${name}`, { sticky: true });
  };

  return <GeoJSON data={geoData} style={style} onEachFeature={onEachFeature} />;
}
