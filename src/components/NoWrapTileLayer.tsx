import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Bornes du monde Web Mercator : évite de charger des tuiles hors-monde
// (viewport > 1024px au zoom 2 → tuiles x=-1/x=4 → 400 OSM dans la console)
const WORLD_BOUNDS = L.latLngBounds([-85.0511, -180], [85.0511, 180]);

export default function NoWrapTileLayer() {
  const map = useMap();
  useEffect(() => {
    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OSM',
      noWrap: true,
      bounds: WORLD_BOUNDS,
    });
    tileLayer.addTo(map);
    return () => { map.removeLayer(tileLayer); };
  }, [map]);
  return null;
}
