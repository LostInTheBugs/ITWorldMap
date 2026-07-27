export type Lang = "fr" | "en";

export const translations: Record<Lang, Record<string, string>> = {
  fr: {
    // App
    "app.title": "🌍 ITWorldMap",
    "app.mode.single": "1 carte",
    "app.mode.dual": "2 cartes",
    "app.mode.ratio": "Ratio",
    "app.mode.single.title": "Une carte, un indicateur",
    "app.mode.dual.title": "Deux cartes, un indicateur chacune",
    "app.mode.ratio.title": "Carte unique : ratio de deux indicateurs",
    "app.mode.single.select": "Indicateur",
    "app.mode.dual.selectA": "Carte gauche",
    "app.mode.dual.selectB": "Carte droite",
    "app.mode.ratio.selectA": "Numérateur",
    "app.mode.ratio.selectB": "Dénominateur",
    "app.mode.dual.hint": "Zoom et déplacement synchronisés entre les deux cartes.",
    "app.mode.ratio.hint": "Affiche {a} ÷ {b} par pays.",
    "app.cables": "🔌 Câbles sous-marins",
    "app.scatter.title": "Corrélation : {x} vs. {y}",
    "app.lang": "Langue",

    // Disclaimer
    "disclaimer.text": "⚠️ Cette application est une démo/test. Les données peuvent contenir des erreurs ou des valeurs obsolètes. Ne pas utiliser à des fins de décision.",
    "disclaimer.dismiss": "Compris",

    // Data source
    "datasource.label": "Sources",
    "datasource.text": "Données : World Bank (api.worldbank.org), OpenStreetMap. Millésime : selon disponibilité par pays (jusqu'à 2025).",

    // Map
    "map.geoerror": "Impossible de charger les frontières",
    "map.legend.title": "Échelle",
    "map.legend.quantiles": "(quantiles)",
    "map.legend.na": "N/A",
    "map.na": "N/A",

    // Scatter
    "scatter.nodata": "Pas de données",

    // Indicators (short labels used in scatter)
    "indicator.population": "👥 Population",
    "indicator.gdp_per_capita": "💰 PIB / habitant ($ US)",
    "indicator.co2_per_capita": "🏭 CO₂ / habitant (tonnes)",
    "indicator.internet_users_pct": "🌐 Utilisateurs Internet (%)",
    "indicator.mobile_subscriptions_per100": "📱 Abonnements mobiles /100 hab.",
    "indicator.fixed_broadband_per100": "🛜 Haut débit fixe /100 hab.",
    "indicator.electricity_access_pct": "⚡ Accès électricité (%)",
    "indicator.secure_servers_per_million": "🔒 Serveurs sécurisés /M hab.",

    // Indicator shorts
    "short.population": "Population",
    "short.gdp_per_capita": "PIB / hab.",
    "short.co2_per_capita": "CO₂ / hab.",
    "short.internet_users_pct": "Internet %",
    "short.mobile_subscriptions_per100": "Mobile /100",
    "short.fixed_broadband_per100": "Haut débit /100",
    "short.electricity_access_pct": "Électricité %",
    "short.secure_servers_per_million": "Serveurs séc.",
  },
  en: {
    // App
    "app.title": "🌍 ITWorldMap",
    "app.mode.single": "1 map",
    "app.mode.dual": "2 maps",
    "app.mode.ratio": "Ratio",
    "app.mode.single.title": "One map, one indicator",
    "app.mode.dual.title": "Two maps, one indicator each",
    "app.mode.ratio.title": "Single map: ratio of two indicators",
    "app.mode.single.select": "Indicator",
    "app.mode.dual.selectA": "Left map",
    "app.mode.dual.selectB": "Right map",
    "app.mode.ratio.selectA": "Numerator",
    "app.mode.ratio.selectB": "Denominator",
    "app.mode.dual.hint": "Zoom and pan synchronized across both maps.",
    "app.mode.ratio.hint": "Displays {a} ÷ {b} per country.",
    "app.cables": "🔌 Submarine cables",
    "app.scatter.title": "Correlation: {x} vs. {y}",
    "app.lang": "Language",

    // Disclaimer
    "disclaimer.text": "⚠️ This application is a demo/test. Data may contain errors or outdated values. Do not use for decision-making purposes.",
    "disclaimer.dismiss": "Got it",

    // Data source
    "datasource.label": "Sources",
    "datasource.text": "Data: World Bank (api.worldbank.org), OpenStreetMap. Vintage: varies by country (up to 2025).",

    // Map
    "map.geoerror": "Unable to load country borders",
    "map.legend.title": "Scale",
    "map.legend.quantiles": "(quantiles)",
    "map.legend.na": "N/A",
    "map.na": "N/A",

    // Scatter
    "scatter.nodata": "No data",

    // Indicators
    "indicator.population": "👥 Population",
    "indicator.gdp_per_capita": "💰 GDP / capita ($ US)",
    "indicator.co2_per_capita": "🏭 CO₂ / capita (tons)",
    "indicator.internet_users_pct": "🌐 Internet users (%)",
    "indicator.mobile_subscriptions_per100": "📱 Mobile subscriptions /100",
    "indicator.fixed_broadband_per100": "🛜 Fixed broadband /100",
    "indicator.electricity_access_pct": "⚡ Electricity access (%)",
    "indicator.secure_servers_per_million": "🔒 Secure servers /M pop.",

    // Indicator shorts
    "short.population": "Population",
    "short.gdp_per_capita": "GDP / cap.",
    "short.co2_per_capita": "CO₂ / cap.",
    "short.internet_users_pct": "Internet %",
    "short.mobile_subscriptions_per100": "Mobile /100",
    "short.fixed_broadband_per100": "Broadband /100",
    "short.electricity_access_pct": "Electricity %",
    "short.secure_servers_per_million": "Secure servers",
  },
};

export function t(lang: Lang, key: string, vars?: Record<string, string>): string {
  let text = translations[lang]?.[key] ?? translations.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}
