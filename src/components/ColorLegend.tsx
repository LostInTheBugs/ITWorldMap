interface Props {
  palette: string[];
  thresholds: number[];
  values: number[];
}

export default function ColorLegend({ palette, thresholds, values }: Props) {
  const min = values.length > 0 ? values[0] : 0;
  const max = values.length > 0 ? values[values.length - 1] : 1;

  function fmt(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
    return n.toFixed(1);
  }

  return (
    <div className="absolute bottom-6 right-6 bg-gray-900/90 backdrop-blur rounded-lg shadow-lg p-3 z-[1000] text-white">
      <div className="text-[10px] font-semibold mb-1.5 text-gray-400 uppercase tracking-wider">
        Échelle (quantiles)
      </div>
      <div className="flex items-center gap-0.5">
        {palette.map((color, i) => {
          // Intervalle : de thresholds[i-1] à thresholds[i]
          const lo = i === 0 ? min : thresholds[i - 1];
          const hi = i === palette.length - 1 ? max : thresholds[i];
          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className="w-8 h-4 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] text-gray-500 mt-0.5">
                {i === 0 ? `<${fmt(hi)}` : i === palette.length - 1 ? `>${fmt(lo)}` : fmt(lo)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
