import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { CountryData } from "../data/types";

interface Props {
  data: CountryData[];
  xIndicator: string;
  yIndicator: string;
  xLabel: string;
  yLabel: string;
  t: (key: string) => string;
}

function fmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return n.toFixed(1);
}

function pickScale(extent: [number, number]) {
  const useLog = extent[0] > 0 && extent[1] / extent[0] > 1000;
  return useLog ? d3.scaleLog() : d3.scaleLinear();
}

export default function ScatterPlot({ data, xIndicator, yIndicator, xLabel, yLabel, t }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const valid = data.filter(
      (d) => typeof d[xIndicator] === "number" && typeof d[yIndicator] === "number",
    ) as (CountryData & Record<string, number>)[];

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 15, right: 15, bottom: 35, left: 48 };
    const width = 280 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    if (valid.length === 0) {
      svg.append("text")
        .attr("x", (width + margin.left + margin.right) / 2)
        .attr("y", (height + margin.top + margin.bottom) / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "10")
        .attr("fill", "#9ca3af")
        .text(t("scatter.nodata"));
      return;
    }

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(valid, (d) => d[xIndicator]) as [number, number];
    const yExtent = d3.extent(valid, (d) => d[yIndicator]) as [number, number];

    const x = pickScale(xExtent).domain(xExtent).range([0, width]).nice();
    const y = pickScale(yExtent).domain(yExtent).range([height, 0]).nice();

    const xs = valid.map((d) => d[xIndicator]);
    const ys = valid.map((d) => d[yIndicator]);
    const mx = d3.mean(xs)!;
    const my = d3.mean(ys)!;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      dx += (xs[i] - mx) ** 2;
      dy += (ys[i] - my) ** 2;
    }
    const r = dx && dy ? num / Math.sqrt(dx * dy) : 0;

    g.selectAll("circle")
      .data(valid)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d[xIndicator]))
      .attr("cy", (d) => y(d[yIndicator]))
      .attr("r", 3.5)
      .attr("fill", "#60a5fa")
      .attr("opacity", 0.7)
      .append("title")
      .text((d) => `${d.iso3}: ${fmt(d[xIndicator])}, ${fmt(d[yIndicator])}`);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat((v) => fmt(v as number)))
      .selectAll("text").attr("fill", "#6b7280").attr("font-size", "8");

    g.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat((v) => fmt(v as number)))
      .selectAll("text").attr("fill", "#6b7280").attr("font-size", "8");

    g.selectAll(".domain, .tick line").attr("stroke", "#d1d5db");

    g.append("text")
      .attr("x", width / 2).attr("y", height + 30)
      .attr("text-anchor", "middle").attr("font-size", "9").attr("fill", "#6b7280")
      .text(xLabel);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2).attr("y", -38)
      .attr("text-anchor", "middle").attr("font-size", "9").attr("fill", "#6b7280")
      .text(yLabel);

    g.append("text")
      .attr("x", width).attr("y", 2)
      .attr("text-anchor", "end").attr("font-size", "9").attr("font-weight", "600")
      .attr("fill", Math.abs(r) > 0.5 ? "#2563eb" : "#9ca3af")
      .text(`r = ${r.toFixed(2)} (n=${valid.length})`);
  }, [data, xIndicator, yIndicator, xLabel, yLabel, t]);

  return (
    <div style={{ background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: 8 }}>
      <svg ref={svgRef} />
    </div>
  );
}
