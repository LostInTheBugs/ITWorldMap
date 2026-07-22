import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface CountryData {
  iso3: string;
  [key: string]: number | string;
}

interface Props {
  data: CountryData[];
  xIndicator: string;
  yIndicator: string;
  xLabel: string;
  yLabel: string;
}

export default function ScatterPlot({
  data,
  xIndicator,
  yIndicator,
  xLabel,
  yLabel,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const valid = data.filter(
      (d) =>
        typeof d[xIndicator] === "number" && typeof d[yIndicator] === "number"
    ) as (CountryData & Record<string, number>)[];

    if (valid.length === 0) return;

    const margin = { top: 15, right: 15, bottom: 35, left: 45 };
    const width = 280 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(valid, (d) => d[xIndicator]) as [number, number];
    const yExtent = d3.extent(valid, (d) => d[yIndicator]) as [number, number];

    const x = d3.scaleLinear().domain(xExtent).range([0, width]).nice();
    const y = d3.scaleLinear().domain(yExtent).range([height, 0]).nice();

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
      .text(
        (d) =>
          `${d.iso3}: ${d[xIndicator].toFixed(1)}, ${d[yIndicator].toFixed(1)}`
      );

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(4))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .attr("font-size", "8");

    g.append("g")
      .call(d3.axisLeft(y).ticks(4))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .attr("font-size", "8");

    g.selectAll(".domain, .tick line").attr("stroke", "#d1d5db");

    // Labels
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "9")
      .attr("fill", "#6b7280")
      .text(xLabel);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .attr("font-size", "9")
      .attr("fill", "#6b7280")
      .text(yLabel);
  }, [data, xIndicator, yIndicator, xLabel, yLabel]);

  return (
    <div className="bg-gray-100 rounded-lg p-2">
      <svg ref={svgRef} />
    </div>
  );
}
