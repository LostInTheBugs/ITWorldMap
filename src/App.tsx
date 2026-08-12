import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Map from "./components/Map";
import type { MapMode, MapFocus } from "./components/Map";
import ScatterPlot from "./components/ScatterPlot";
import indicatorsRaw from "./data/indicators.json";
import type { CountryData } from "./data/types";
import { useLang } from "./i18n/LangContext";
import { countryName, flagEmoji, type CountryEntry } from "./utils/countries";
import { fmt } from "./utils/format";

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

  // État initial depuis l'URL (?mode=&a=&b=&x=&y=&cables=&c=&lang=)
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

  const [countryIndex, setCountryIndex] = useState<Record<string, CountryEntry>>({});
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [search, setSearch] = useState("");

  // Ref pour que les handlers de clic des layers Leaflet (créés une seule fois)
  // voient toujours l'index pays à jour (sinon closure figée sur {} au chargement).
  const countryIndexRef = useRef(countryIndex);
  useEffect(() => {
    countryIndexRef.current = countryIndex;
  }, [countryIndex]);

  const [panels, setPanels] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem("itwm_panels") ?? "{}") as Record<string, unknown>;
      return { ctrl: true, scatter: p.scatter !== false };
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
    if (selectedIso3) p.set("c", selectedIso3);
    p.set("lang", lang);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [mode, indicatorA, indicatorB, xAxis, yAxis, showCables, selectedIso3, lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Décale le contrôle de zoom Leaflet (top-right) sous la bannière disclaimer
  useEffect(() => {
    document.body.classList.toggle("itwm-disclaimer", !disclaimerDismissed);
  }, [disclaimerDismissed]);

  // Pays sélectionné via ?c= (validé une fois l'index pays chargé)
  useEffect(() => {
    const c = initialParams.get("c");
    if (c && countryIndex[c] && !selectedIso3) setSelectedIso3(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIndex, initialParams]);

  const needsB = mode === "dual" || mode === "ratio";

  const labelOf = (key: string, kind: "labelKey" | "shortKey") =>
    t(ALL_INDICATORS.find((i) => i.key === key)?.[kind] ?? "");

  const renderOptions = () =>
    INDICATORS.map((ind) => <option key={ind.key} value={ind.key}>{t(ind.labelKey)}</option>);

  const dismissDisclaimer = () => {
    setDisclaimerDismissed(true);
    localStorage.setItem("itwm_disclaimer", "1");
  };

  // Rangs mondiaux par indicateur (pour la fiche pays)
  const rankOf = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const ind of ALL_INDICATORS) {
      const key = ind.key;
      const sorted = indicatorsData
        .filter((d) => typeof d[key] === "number")
        .sort((a, b) => (b[key] as number) - (a[key] as number));
      const ranks: Record<string, number> = {};
      sorted.forEach((d, i) => { ranks[d.iso3] = i + 1; });
      map[key] = ranks;
    }
    return map;
  }, []);

  // Liste de pays localisée pour la recherche
  const countryList = useMemo(() =>
    Object.values(countryIndex).map((c) => ({
      ...c,
      nameFr: countryName(c.iso3, c.name, "fr"),
      nameEn: countryName(c.iso3, c.name, "en"),
    })),
  [countryIndex]);

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return countryList
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameFr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, countryList]);

  // Stable : référencé par les handlers de clic des layers (attachés une seule fois)
  const selectCountry = useCallback((iso3: string) => {
    const c = countryIndexRef.current[iso3];
    if (!c) return;
    setSelectedIso3(iso3);
    setFocus({ lat: c.lat, lng: c.lng, zoom: 5 });
    setSearch("");
  }, []);

  const selectedEntry = selectedIso3 ? countryIndex[selectedIso3] : undefined;
  const selectedData = selectedIso3 ? indicatorsData.find((d) => d.iso3 === selectedIso3) : undefined;
  const selectedRank = selectedIso3 ? rankOf[indicatorA]?.[selectedIso3] : undefined;
  const selectedRankTotal = indicatorA ? Object.keys(rankOf[indicatorA] ?? {}).length : 0;

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
        focus={focus}
        selectedIso3={selectedIso3}
        onSelectCountry={selectCountry}
        onIndexReady={setCountryIndex}
        secondaryKey="gdp_per_capita"
        secondaryLabel={t("indicator.gdp_per_capita")}
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

          {/* Recherche de pays */}
          <div style={{ marginTop: 10, position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("app.search.placeholder")}
              aria-label={t("app.search.placeholder")}
              style={{ ...selectStyle, marginTop: 0 }}
            />
            {searchMatches.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1100,
                maxHeight: 180, overflowY: "auto",
              }}>
                {searchMatches.map((c) => (
                  <button
                    key={c.iso3}
                    onClick={() => selectCountry(c.iso3)}
                    className="itwm-search-item"
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      width: "100%", padding: "6px 10px", border: "none", background: "transparent",
                      cursor: "pointer", fontSize: 12, textAlign: "left", color: "#111827",
                    }}
                  >
                    <span>{flagEmoji(c.iso3)} {lang === "fr" ? c.nameFr : c.nameEn}</span>
                    <span style={{ color: "#9ca3af", fontSize: 10 }}>{c.iso3}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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

      {/* Country detail panel — top right */}
      {selectedIso3 && selectedEntry && (
        <div style={{
          ...panelStyle,
          top: disclaimerDismissed ? 56 : 94, right: 10, maxWidth: 270,
          maxHeight: "calc(100% - 210px)", overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {flagEmoji(selectedIso3)} {countryName(selectedIso3, selectedEntry.name, lang)}
            </div>
            <button
              onClick={() => setSelectedIso3(null)}
              title={t("app.close")}
              aria-label={t("app.close")}
              style={iconBtnStyle}
            >
              ✕
            </button>
          </div>
          {selectedData && selectedRank !== undefined && (
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
              {t("app.detail.rank", {
                rank: String(selectedRank),
                total: String(selectedRankTotal),
                ind: labelOf(indicatorA, "shortKey"),
              })}
            </div>
          )}
          {ALL_INDICATORS.map((ind) => {
            const v = selectedData?.[ind.key];
            const y = selectedData?.[`${ind.key}_year`];
            const r = selectedIso3 ? rankOf[ind.key]?.[selectedIso3] : undefined;
            return (
              <div key={ind.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, padding: "3px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ color: "#4b5563" }}>{t(ind.labelKey)}</span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {typeof v === "number" ? fmt(v) : "—"}
                  {typeof y === "string" ? ` (${y})` : ""}
                  {r ? <span style={{ color: "#9ca3af", fontWeight: 400 }}> · #{r}</span> : null}
                </span>
              </div>
            );
          })}
        </div>
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
