interface Props {
  palette: string[];
  thresholds: number[];
  values: number[];
  title?: string;
  hasNoData?: boolean;
}

function fmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return n.toFixed(1);
}

export default function ColorLegend({ palette, thresholds, values, title, hasNoData = true }: Props) {
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
        {title ? title : "Échelle"} <span style={{ fontWeight: 400 }}>(quantiles)</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        {palette.map((color, i) => {
          const lo = i === 0 ? min : thresholds[i - 1];
          const hi = i === palette.length - 1 ? max : thresholds[i];
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
            <span style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>N/A</span>
          </div>
        )}
      </div>
    </div>
  );
}
