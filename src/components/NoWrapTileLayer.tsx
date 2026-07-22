import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function NoWrapTileLayer() {
  const map = useMap();

  useEffect(() => {
    const tileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        noWrap: true,
      }
    );
    tileLayer.addTo(map);
    return () => { map.removeLayer(tileLayer); };
  }, [map]);

  return null;
}
