import { useState, useMemo, useEffect } from "react";
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

const iconBtnStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#f3f4f6",
  borderRadius: 4,
  cursor: "pointer",
  padding: "2px 7px",
  fontSize: 12,
  lineHeight: "1.5",
  color: "#374151",
};

export default function App() {
  const { lang, setLang, t } = useLang();
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(
    () => localStorage.getItem("itwm_disclaimer") === "1",
  );

  const INDICATORS = useMemo(() => {
    const availableKeys = new Set(
      indicatorsData.flatMap((c) => Object.keys(c)).filter((k) => k !== "iso3" && !k.endsWith("_year")),
    );
    return ALL_INDICATORS.filter((ind) => availableKeys.has(ind.key));
  }, []);

  const validKeys = useMemo(() => INDICATORS.map((i) => i.key), [INDICATORS]);
  const firstKey = INDICATORS[0]?.key ?? "population";
  const secondKey = INDICATORS[1]?.key ?? firstKey;

  // État initial depuis l'URL (?mode=&a=&b=&x=&y=&cables=&lang=)
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const readParam = (key: string, fallback: string) => {
    const v = initialParams.get(key);
    return v && validKeys.includes(v) ? v : fallback;
  };

  const [mode, setMode] = useState<MapMode>(() => {
    const m = initialParams.get("mode");
    return m === "dual" || m === "ratio" || m === "single" ? m : "single";
  });
  const [indicatorA, setIndicatorA] = useState(() => readParam("a", firstKey));
  const [indicatorB, setIndicatorB] = useState(() => readParam("b", secondKey));
  const [xAxis, setXAxis] = useState(() => readParam("x", secondKey));
  const [yAxis, setYAxis] = useState(() => readParam("y", firstKey));
  const [showCables, setShowCables] = useState(() => initialParams.get("cables") === "1");
  const [viewToken, setViewToken] = useState(0);

  const [panels, setPanels] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem("itwm_panels") ?? "{}") as Record<string, unknown>;
      return { ctrl: p.ctrl !== false, scatter: p.scatter !== false };
    } catch {
      return { ctrl: true, scatter: true };
    }
  });
  useEffect(() => {
    localStorage.setItem("itwm_panels", JSON.stringify(panels));
  }, [panels]);

  // Synchronise l'état vers l'URL (liens partageables, état conservé au refresh)
  useEffect(() => {
    const p = new URLSearchParams();
    p.set("mode", mode);
    p.set("a", indicatorA);
    p.set("b", indicatorB);
    p.set("x", xAxis);
    p.set("y", yAxis);
    if (showCables) p.set("cables", "1");
    p.set("lang", lang);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [mode, indicatorA, indicatorB, xAxis, yAxis, showCables, lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const needsB = mode === "dual" || mode === "ratio";

  const labelOf = (key: string, kind: "labelKey" | "shortKey") =>
    t(ALL_INDICATORS.find((i) => i.key === key)?.[kind] ?? "");

  const renderOptions = () =>
    INDICATORS.map((ind) => <option key={ind.key} value={ind.key}>{t(ind.labelKey)}</option>);

  const dismissDisclaimer = () => {
    setDisclaimerDismissed(true);
    localStorage.setItem("itwm_disclaimer", "1");
  };

  return (
    <>
      <Map
        data={indicatorsData}
        indicatorA={indicatorA}
        labelA={labelOf(indicatorA, "labelKey")}
        shortA={labelOf(indicatorA, "shortKey")}
        indicatorB={indicatorB}
        labelB={labelOf(indicatorB, "labelKey")}
        shortB={labelOf(indicatorB, "shortKey")}
        showCables={showCables}
        mode={mode}
        resetToken={viewToken}
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
            onClick={dismissDisclaimer}
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
      {panels.ctrl ? (
        <div style={{ ...panelStyle, top: disclaimerDismissed ? 10 : 48, left: 10, maxWidth: 290 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{t("app.title")}</h1>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                onClick={() => setViewToken((v) => v + 1)}
                title={t("app.resetView")}
                aria-label={t("app.resetView")}
                style={iconBtnStyle}
              >
                🌐
              </button>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "fr" | "en")}
                style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: "1px solid #ccc" }}
                title={t("app.lang")}
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
              <button
                onClick={() => setPanels((p) => ({ ...p, ctrl: false }))}
                title={t("app.collapse")}
                aria-label={t("app.collapse")}
                style={iconBtnStyle}
              >
                —
              </button>
            </div>
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
                  aria-pressed={active}
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
                a: labelOf(indicatorA, "shortKey"),
                b: labelOf(indicatorB, "shortKey"),
              })}
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={showCables} onChange={(e) => setShowCables(e.target.checked)} />
            {t("app.cables")}
          </label>
        </div>
      ) : (
        <button
          onClick={() => setPanels((p) => ({ ...p, ctrl: true }))}
          title={t("app.expand")}
          aria-label={t("app.expand")}
          style={{
            ...iconBtnStyle,
            position: "absolute", top: disclaimerDismissed ? 10 : 48, left: 10,
            zIndex: 1000, background: "rgba(255,255,255,0.92)",
            padding: "8px 10px", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          ⚙️
        </button>
      )}

      {/* Scatter panel — bottom left */}
      {panels.scatter ? (
        <div style={{ ...panelStyle, bottom: 10, left: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
              {t("app.scatter.title", {
                x: labelOf(xAxis, "shortKey"),
                y: labelOf(yAxis, "shortKey"),
              })}
            </div>
            <button
              onClick={() => setPanels((p) => ({ ...p, scatter: false }))}
              title={t("app.collapse")}
              aria-label={t("app.collapse")}
              style={iconBtnStyle}
            >
              —
            </button>
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
            xLabel={labelOf(xAxis, "shortKey")}
            yLabel={labelOf(yAxis, "shortKey")}
            t={t}
          />
        </div>
      ) : (
        <button
          onClick={() => setPanels((p) => ({ ...p, scatter: true }))}
          title={t("app.expand")}
          aria-label={t("app.expand")}
          style={{
            ...iconBtnStyle,
            position: "absolute", bottom: 10, left: 10,
            zIndex: 1000, background: "rgba(255,255,255,0.92)",
            padding: "8px 10px", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          📊
        </button>
      )}

      {/* Data source footer */}
      <div style={{
        position: "absolute", bottom: 70, right: 12, zIndex: 999,
        fontSize: 9, color: "#9ca3af", background: "rgba(255,255,255,0.85)",
        borderRadius: 4, padding: "3px 8px",
      }}>
        <strong>{t("datasource.label")} :</strong> {t("datasource.text")}
      </div>
    </>
  );
}
