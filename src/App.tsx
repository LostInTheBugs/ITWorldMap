import { useState, useMemo } from "react";
import Map from "./components/Map";
import type { MapMode } from "./components/Map";
import ScatterPlot from "./components/ScatterPlot";
import indicatorsRaw from "./data/indicators.json";
import type { CountryData } from "./data/types";
import { useLang } from "./i18n/LangContext";

const indicatorsData = indicatorsRaw as CountryData[];

const ALL_INDICATORS: { key: string; labelKey: string; shortKey: string }[] = [
  { key: "population", labelKey: "indicator.population", shortKey: "short.population" },
  { key: "gdp_per_capita", labelKey: "indicator.gdp_per_capita", shortKey: "short.gdp_per_capita" },
  { key: "co2_per_capita", labelKey: "indicator.co2_per_capita", shortKey: "short.co2_per_capita" },
  { key: "internet_users_pct", labelKey: "indicator.internet_users_pct", shortKey: "short.internet_users_pct" },
  { key: "mobile_subscriptions_per100", labelKey: "indicator.mobile_subscriptions_per100", shortKey: "short.mobile_subscriptions_per100" },
  { key: "fixed_broadband_per100", labelKey: "indicator.fixed_broadband_per100", shortKey: "short.fixed_broadband_per100" },
  { key: "electricity_access_pct", labelKey: "indicator.electricity_access_pct", shortKey: "short.electricity_access_pct" },
  { key: "secure_servers_per_million", labelKey: "indicator.secure_servers_per_million", shortKey: "short.secure_servers_per_million" },
];

const MODES: { key: MapMode; labelKey: string; titleKey: string }[] = [
  { key: "single", labelKey: "app.mode.single", titleKey: "app.mode.single.title" },
  { key: "dual", labelKey: "app.mode.dual", titleKey: "app.mode.dual.title" },
  { key: "ratio", labelKey: "app.mode.ratio", titleKey: "app.mode.ratio.title" },
];

const panelStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 1000,
  background: "rgba(255,255,255,0.92)",
  borderRadius: 8,
  padding: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 13,
  outline: "none",
  marginTop: 4,
};

export default function App() {
  const { lang, setLang, t } = useLang();
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false);

  const INDICATORS = useMemo(() => {
    const availableKeys = new Set(
      indicatorsData.flatMap((c) => Object.keys(c)).filter((k) => k !== "iso3" && !k.endsWith("_year")),
    );
    return ALL_INDICATORS.filter((ind) => availableKeys.has(ind.key));
  }, []);

  const firstKey = INDICATORS[0]?.key ?? "population";
  const secondKey = INDICATORS[1]?.key ?? firstKey;

  const [mode, setMode] = useState<MapMode>("single");
  const [indicatorA, setIndicatorA] = useState(firstKey);
  const [indicatorB, setIndicatorB] = useState(secondKey);
  const [showCables, setShowCables] = useState(false);

  const [xAxis, setXAxis] = useState(secondKey);
  const [yAxis, setYAxis] = useState(firstKey);

  const needsB = mode === "dual" || mode === "ratio";

  const renderOptions = () =>
    INDICATORS.map((ind) => <option key={ind.key} value={ind.key}>{t(ind.labelKey)}</option>);

  return (
    <>
      <Map
        data={indicatorsData}
        indicatorA={indicatorA}
        labelA={t(
          ALL_INDICATORS.find((i) => i.key === indicatorA)?.labelKey ?? "indicator.population",
        )}
        shortA={t(
          ALL_INDICATORS.find((i) => i.key === indicatorA)?.shortKey ?? "short.population",
        )}
        indicatorB={indicatorB}
        labelB={t(
          ALL_INDICATORS.find((i) => i.key === indicatorB)?.labelKey ?? "indicator.population",
        )}
        shortB={t(
          ALL_INDICATORS.find((i) => i.key === indicatorB)?.shortKey ?? "short.population",
        )}
        showCables={showCables}
        mode={mode}
        t={t}
      />

      {/* Disclaimer banner */}
      {!disclaimerDismissed && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000,
          background: "#fef3c7", borderBottom: "1px solid #f59e0b",
          padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, color: "#92400e",
        }}>
          <span>{t("disclaimer.text")}</span>
          <button
            onClick={() => setDisclaimerDismissed(true)}
            style={{
              marginLeft: 16, padding: "4px 12px", fontSize: 12,
              background: "#f59e0b", color: "#fff", border: "none",
              borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {t("disclaimer.dismiss")}
          </button>
        </div>
      )}

      {/* Control panel — top left */}
      <div style={{ ...panelStyle, top: disclaimerDismissed ? 10 : 48, left: 10, maxWidth: 290 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t("app.title")}</h1>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "fr" | "en")}
            style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: "1px solid #ccc" }}
            title={t("app.lang")}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </div>

        {/* Mode segmented control */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                title={t(m.titleKey)}
                style={{
                  flex: 1, padding: "6px 4px", fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#fff" : "#374151",
                  background: active ? "#2563eb" : "#f3f4f6",
                  border: "1px solid " + (active ? "#2563eb" : "#d1d5db"),
                  borderRadius: 6, cursor: "pointer",
                }}
              >
                {t(m.labelKey)}
              </button>
            );
          })}
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
          {mode === "dual"
            ? t("app.mode.dual.selectA")
            : mode === "ratio"
              ? t("app.mode.ratio.selectA")
              : t("app.mode.single.select")}
        </label>
        <select value={indicatorA} onChange={(e) => setIndicatorA(e.target.value)} style={selectStyle} aria-label="Main indicator">
          {renderOptions()}
        </select>

        {needsB && (
          <>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", display: "block", marginTop: 8 }}>
              {mode === "dual" ? t("app.mode.dual.selectB") : t("app.mode.ratio.selectB")}
            </label>
            <select value={indicatorB} onChange={(e) => setIndicatorB(e.target.value)} style={selectStyle} aria-label="Secondary indicator">
              {renderOptions()}
            </select>
          </>
        )}

        {mode === "dual" && (
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>{t("app.mode.dual.hint")}</div>
        )}
        {mode === "ratio" && (
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
            {t("app.mode.ratio.hint", {
              a: t(ALL_INDICATORS.find((i) => i.key === indicatorA)?.shortKey ?? ""),
              b: t(ALL_INDICATORS.find((i) => i.key === indicatorB)?.shortKey ?? ""),
            })}
          </div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={showCables} onChange={(e) => setShowCables(e.target.checked)} />
          {t("app.cables")}
        </label>
      </div>

      {/* Scatter panel — bottom left */}
      <div style={{ ...panelStyle, bottom: 10, left: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 6 }}>
          {t("app.scatter.title", {
            x: t(ALL_INDICATORS.find((i) => i.key === xAxis)?.shortKey ?? ""),
            y: t(ALL_INDICATORS.find((i) => i.key === yAxis)?.shortKey ?? ""),
          })}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} style={{ ...selectStyle, marginTop: 0, fontSize: 11, padding: "4px 6px" }} aria-label="X axis">
            {renderOptions()}
          </select>
          <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} style={{ ...selectStyle, marginTop: 0, fontSize: 11, padding: "4px 6px" }} aria-label="Y axis">
            {renderOptions()}
          </select>
        </div>
        <ScatterPlot
          data={indicatorsData}
          xIndicator={xAxis}
          yIndicator={yAxis}
          xLabel={t(ALL_INDICATORS.find((i) => i.key === xAxis)?.shortKey ?? "")}
          yLabel={t(ALL_INDICATORS.find((i) => i.key === yAxis)?.shortKey ?? "")}
          t={t}
        />
      </div>

      {/* Data source footer */}
      <div style={{
        position: "absolute", bottom: 10, right: 10, zIndex: 999,
        fontSize: 9, color: "#9ca3af", background: "rgba(255,255,255,0.85)",
        borderRadius: 4, padding: "3px 8px",
      }}>
        <strong>{t("datasource.label")} :</strong> {t("datasource.text")}
      </div>
    </>
  );
}
