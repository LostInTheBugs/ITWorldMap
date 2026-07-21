interface Props {
  min: number;
  max: number;
  getColor: (value: number, min: number, max: number) => string;
}

export default function ColorLegend({ min, max, getColor }: Props) {
  const steps = 6;
  const range = Array.from({ length: steps }, (_, i) => {
    const value = min + (max - min) * (i / (steps - 1));
    return { value, color: getColor(value, min, max) };
  });

  function fmt(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
    return n.toFixed(1);
  }

  return (
    <div className="absolute bottom-6 right-6 bg-gray-900/90 backdrop-blur rounded-lg shadow-lg p-3 z-[1000] text-white">
      <div className="text-[10px] font-semibold mb-1.5 text-gray-400 uppercase tracking-wider">
        Échelle
      </div>
      <div className="flex items-center gap-0.5">
        {range.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className="w-8 h-4 rounded-sm"
              style={{ backgroundColor: step.color }}
            />
            <span className="text-[9px] text-gray-500 mt-0.5">
              {fmt(step.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
