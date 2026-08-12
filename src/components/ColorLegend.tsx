import { fmt } from "../utils/format";

interface Props {
  palette: string[];
  thresholds: number[];
  values: number[];
  title?: string;
  hasNoData?: boolean;
  t: (key: string) => string;
}

export default function ColorLegend({ palette, thresholds, values, title, hasNoData = true, t }: Props) {
  const min = values.length > 0 ? values[0] : 0;
  const max = values.length > 0 ? values[values.length - 1] : 1;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        background: "rgba(255,255,255,0.92)",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: 10,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          marginBottom: 6,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          maxWidth: 200,
        }}
      >
        {title ? title : t("map.legend.title")} <span style={{ fontWeight: 400 }}>{t("map.legend.quantiles")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        {palette.map((color, i) => {
          const lo = i === 0 ? min : thresholds[i - 1];
          const hi = i === palette.length - 1 ? max : thresholds[i];
          const rangeLabel = i === 0 ? `<${fmt(hi)}` : i === palette.length - 1 ? `>${fmt(lo)}` : `${fmt(lo)}–${fmt(hi)}`;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }} title={rangeLabel}>
              <div style={{ width: 30, height: 14, borderRadius: 2, backgroundColor: color }} />
              <span style={{ fontSize: 9, color: "#6b7280", marginTop: 2, whiteSpace: "nowrap" }}>
                {i === 0 ? `<${fmt(hi)}` : i === palette.length - 1 ? `>${fmt(lo)}` : fmt(lo)}
              </span>
            </div>
          );
        })}
        {hasNoData && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginLeft: 6 }}>
            <div style={{ width: 30, height: 14, borderRadius: 2, backgroundColor: "#d4d4d4" }} />
            <span style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{t("map.legend.na")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
