import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Map from "./components/Map";
import type { MapMode, MapFocus } from "./components/Map";
import ScatterPlot from "./components/ScatterPlot";
import indicatorsRaw from "./data/indicators.json";
import type { CountryData } from "./data/types";
import { useLang } from "./i18n/LangContext";
import { countryName, flagEmoji, type CountryEntry } from "./utils/countries";
import { fmt } from "./utils/format";
import { fetchSeries, seriesYearRange, seriesValue, type YearSeries } from "./utils/series";
import { useMediaQuery } from "./hooks/useMediaQuery";

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
  const [compareIso3, setCompareIso3] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [search, setSearch] = useState("");

  // Séries temporelles (chargées à la demande au premier usage du slider d'année)
  const [series, setSeries] = useState<YearSeries | null>(null);
  const [seriesError, setSeriesError] = useState(false);
  const [yearMode, setYearMode] = useState(() => {
    const y = initialParams.get("year");
    return y !== null && /^\d{4}$/.test(y);
  });
  const [year, setYear] = useState<number | null>(() => {
    const y = initialParams.get("year");
    return y !== null && /^\d{4}$/.test(y) ? Number(y) : null;
  });
  // Année de la carte B (mode dual uniquement)
  const [yearB, setYearB] = useState<number | null>(() => {
    const y = initialParams.get("yearB");
    return y !== null && /^\d{4}$/.test(y) ? Number(y) : null;
  });

  const loadSeries = useCallback(() => {
    if (series || seriesError) return;
    fetchSeries().then(setSeries).catch(() => setSeriesError(true));
  }, [series, seriesError]);

  // Charge les séries au montage si le mode année est actif (ex: ?year= dans l'URL)
  useEffect(() => {
    if (yearMode && !series && !seriesError) loadSeries();
  }, [yearMode, series, seriesError, loadSeries]);

  const yearRange = useMemo(() => seriesYearRange(series), [series]);

  // Dernière année avec données pour l'indicateur actif (défaut du slider)
  const defaultYear = useMemo(() => {
    if (!series) return null;
    let max = 0;
    for (const byYear of Object.values(series[indicatorA] ?? {})) {
      for (const y of Object.keys(byYear)) max = Math.max(max, Number(y));
    }
    return max || null;
  }, [series, indicatorA]);

  // Rangs recalculés pour l'année sélectionnée (sinon incohérents avec la carte)
  const rankAtYear = useMemo(() => {
    if (year == null || !series) return null;
    const out: Record<string, Record<string, number>> = {};
    for (const ind of ALL_INDICATORS) {
      const vals: [string, number][] = [];
      for (const [iso3, byYear] of Object.entries(series[ind.key] ?? {})) {
        const v = byYear[String(year)];
        if (typeof v === "number") vals.push([iso3, v]);
      }
      vals.sort((a, b) => b[1] - a[1]);
      const ranks: Record<string, number> = {};
      vals.forEach(([iso3], i) => { ranks[iso3] = i + 1; });
      out[ind.key] = ranks;
    }
    return out;
  }, [series, year]);

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
    if (compareIso3) p.set("compare", compareIso3);
    if (year != null) p.set("year", String(year));
    if (yearB != null && mode === "dual") p.set("yearB", String(yearB));
    p.set("lang", lang);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [mode, indicatorA, indicatorB, xAxis, yAxis, showCables, selectedIso3, compareIso3, year, yearB, lang]);

  // Année depuis ?year= (chargée une fois les séries dispo)
  useEffect(() => {
    const y = initialParams.get("year");
    if (y && /^\d{4}$/.test(y) && series && year === null) {
      setYear(Number(y));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, initialParams]);

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
    setFocus({ lat: c.lat, lng: c.lng, zoom: 5 });
    setSearch("");
    setSelectedIso3((cur) => {
      if (compareModeRef.current) {
        // Mode comparaison : le clic/recherche définit (ou remplace) le 2e pays
        if (iso3 !== cur) setCompareIso3(iso3);
        return cur;
      }
      return iso3;
    });
  }, []);

  const compareModeRef = useRef(compareMode);
  useEffect(() => {
    compareModeRef.current = compareMode;
  }, [compareMode]);

  // Pays B depuis ?compare= (validé une fois l'index pays chargé)
  useEffect(() => {
    const c = initialParams.get("compare");
    if (c && countryIndex[c] && !compareIso3) {
      setCompareIso3(c);
      setCompareMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIndex, initialParams]);

  const selectedEntry = selectedIso3 ? countryIndex[selectedIso3] : undefined;
  const selectedData = selectedIso3 ? indicatorsData.find((d) => d.iso3 === selectedIso3) : undefined;
  const rankSrc = rankAtYear ?? rankOf;
  const selectedRank = selectedIso3 ? rankSrc[indicatorA]?.[selectedIso3] : undefined;
  const selectedRankTotal = indicatorA ? Object.keys(rankSrc[indicatorA] ?? {}).length : 0;
  const compareEntry = compareIso3 ? countryIndex[compareIso3] : undefined;
  const compareData = compareIso3 ? indicatorsData.find((d) => d.iso3 === compareIso3) : undefined;

  // Mobile : panneaux en pleine largeur
  const isMobile = useMediaQuery("(max-width: 640px)");
  const panelWidth = isMobile ? "calc(100vw - 20px)" : undefined;

  const startCompare = () => {
    setCompareMode(true);
    setCompareIso3(null);
  };

  const stopCompare = () => {
    setCompareMode(false);
    setCompareIso3(null);
  };

  const swapCompare = () => {
    if (!compareIso3) return;
    setSelectedIso3(compareIso3);
    setCompareIso3(selectedIso3);
  };

  const valueAtYear = (iso3: string, key: string): number | undefined =>
    year != null && series ? seriesValue(series, key, iso3, year) : undefined;

  const yearOf = (iso3: string, key: string): string | undefined => {
    if (year != null && series) {
      return valueAtYear(iso3, key) !== undefined ? String(year) : undefined;
    }
    const d = indicatorsData.find((x) => x.iso3 === iso3);
    const y = d?.[`${key}_year`];
    return typeof y === "string" ? y : undefined;
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
        focus={focus}
        selectedIso3={selectedIso3}
        compareIso3={compareIso3}
        onSelectCountry={selectCountry}
        onIndexReady={setCountryIndex}
        secondaryKey="gdp_per_capita"
        secondaryLabel={t("indicator.gdp_per_capita")}
        year={yearMode ? year : null}
        yearB={mode === "dual" && yearMode ? yearB : null}
        series={series}
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
        <div style={{
          ...panelStyle, top: disclaimerDismissed ? 10 : 48, left: 10,
          maxWidth: panelWidth ?? 290,
          maxHeight: isMobile ? "55vh" : undefined,
          overflowY: isMobile ? "auto" : undefined,
        }}>
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

          {/* Sélecteur d'année (séries temporelles) */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#374151" }}>
            <input
              type="checkbox"
              checked={yearMode}
              onChange={(e) => {
                const on = e.target.checked;
                setYearMode(on);
                if (on) {
                  loadSeries();
                  setYear((cur) => cur ?? defaultYear ?? yearRange?.[1] ?? 2023);
                }
              }}
            />
            {t("app.year.toggle")}
          </label>
          {yearMode && (
            <div style={{ marginTop: 6 }}>
              {seriesError && <div style={{ fontSize: 11, color: "#dc2626" }}>{t("app.year.error")}</div>}
              {!series && !seriesError && <div style={{ fontSize: 11, color: "#6b7280" }}>{t("app.year.loading")}</div>}
              {series && yearRange && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
                    <span>{t("app.year.label")}</span>
                    <span style={{ fontWeight: 700, color: "#2563eb" }}>{year ?? yearRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min={yearRange[0]}
                    max={yearRange[1]}
                    value={year ?? yearRange[1]}
                    onChange={(e) => setYear(Number(e.target.value))}
                    style={{ width: "100%", margin: 0 }}
                    aria-label={t("app.year.label")}
                  />
                  {mode === "dual" && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginTop: 8, marginBottom: 2 }}>
                        <span>{t("app.year.labelB")}</span>
                        <span style={{ fontWeight: 700, color: "#f59e0b" }}>{yearB ?? year ?? yearRange[1]}</span>
                      </div>
                      <input
                        type="range"
                        min={yearRange[0]}
                        max={yearRange[1]}
                        value={yearB ?? year ?? yearRange[1]}
                        onChange={(e) => setYearB(Number(e.target.value))}
                        style={{ width: "100%", margin: 0 }}
                        aria-label={t("app.year.labelB")}
                      />
                    </>
                  )}
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    {t("app.year.hint", { ind: labelOf(indicatorA, "shortKey") })}
                  </div>
                </>
              )}
            </div>
          )}

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
          top: disclaimerDismissed ? 56 : 94, right: 10,
          maxWidth: panelWidth ?? 270,
          maxHeight: "calc(100% - 210px)", overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {flagEmoji(selectedIso3)} {countryName(selectedIso3, selectedEntry.name, lang)}
              {compareMode && (
                <>
                  <span style={{ color: "#9ca3af", fontWeight: 400, margin: "0 4px" }}>vs</span>
                  {compareIso3 && compareEntry
                    ? <span style={{ color: "#f59e0b" }}>{flagEmoji(compareIso3)} {countryName(compareIso3, compareEntry.name, lang)}</span>
                    : <span style={{ color: "#9ca3af", fontWeight: 400 }}>…</span>}
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
              {compareMode && compareIso3 && (
                <button onClick={swapCompare} title={t("app.compare.swap")} aria-label={t("app.compare.swap")} style={iconBtnStyle}>↕</button>
              )}
              {compareMode ? (
                <button onClick={stopCompare} title={t("app.close")} aria-label={t("app.close")} style={iconBtnStyle}>✕</button>
              ) : (
                <>
                  <button onClick={startCompare} title={t("app.compare.start")} aria-label={t("app.compare.start")} style={iconBtnStyle}>➕</button>
                  <button onClick={() => setSelectedIso3(null)} title={t("app.close")} aria-label={t("app.close")} style={iconBtnStyle}>✕</button>
                </>
              )}
            </div>
          </div>
          {compareMode && !compareIso3 && (
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, background: "#f3f4f6", borderRadius: 6, padding: "6px 8px" }}>
              {t("app.compare.hint")}
            </div>
          )}
          {selectedData && selectedRank !== undefined && (
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>{t("app.detail.rank", {
                rank: String(selectedRank),
                total: String(selectedRankTotal),
                ind: labelOf(indicatorA, "shortKey"),
              })}</span>
              {compareMode && compareIso3 && (
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                  #{rankSrc[indicatorA]?.[compareIso3] ?? "—"}
                </span>
              )}
            </div>
          )}
          {ALL_INDICATORS.map((ind) => {
            const vA = valueAtYear(selectedIso3, ind.key) ?? selectedData?.[ind.key];
            const yA = yearOf(selectedIso3, ind.key);
            const vB = compareIso3 ? (valueAtYear(compareIso3, ind.key) ?? compareData?.[ind.key]) : undefined;
            const yB = compareIso3 ? yearOf(compareIso3, ind.key) : undefined;
            const rA = selectedIso3 ? rankSrc[ind.key]?.[selectedIso3] : undefined;
            const rB = compareIso3 ? rankSrc[ind.key]?.[compareIso3] : undefined;
            return (
              <div key={ind.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, padding: "3px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ color: "#4b5563", flex: 1 }}>{t(ind.labelKey)}</span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap", color: compareMode ? "#2563eb" : undefined, textAlign: "right" }}>
                  {typeof vA === "number" ? fmt(vA) : "—"}
                  {typeof yA === "string" ? ` (${yA})` : ""}
                  {rA ? <span style={{ color: "#9ca3af", fontWeight: 400 }}> · #{rA}</span> : null}
                </span>
                {compareMode && compareIso3 && (
                  <span style={{ fontWeight: 600, whiteSpace: "nowrap", color: "#f59e0b", textAlign: "right" }}>
                    {typeof vB === "number" ? fmt(vB) : "—"}
                    {typeof yB === "string" ? ` (${yB})` : ""}
                    {rB ? <span style={{ color: "#9ca3af", fontWeight: 400 }}> · #{rB}</span> : null}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scatter panel — bottom left */}
      {panels.scatter ? (
        <div style={{ ...panelStyle, bottom: 10, left: 10, maxWidth: panelWidth }}>
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
            onSelectCountry={selectCountry}
            selectedIso3={selectedIso3}
            compareIso3={compareIso3}
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
