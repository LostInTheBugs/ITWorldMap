# 🌍 ITWorldMap

Carte du monde interactive visualisant des indicateurs IT (IPv6, Internet, IA) croisés avec des données socio-économiques (population, PIB, CO₂).

## 🚀 Démo

[https://lostinthebugs.github.io/ITWorldMap/](https://lostinthebugs.github.io/ITWorldMap/)

## 📊 Indicateurs

| Catégorie | Indicateur | Source |
|-----------|-----------|--------|
| 👥 Population | Population totale | World Bank |
| 💰 Économie | PIB par habitant ($ US) | World Bank |
| 🏭 Environnement | Émissions CO₂ par habitant | World Bank |
| 🌐 Internet | Utilisateurs Internet (% pop.) | World Bank |
| 🔗 IPv6 | Adoption IPv6 (%) | APNIC / Google |

## 🛠️ Développement

```bash
npm install        # Installer les dépendances
npm run dev        # Serveur local (http://localhost:5173)
npm run build      # Build production
```

### Mise à jour des données

```bash
cd data
python3 scripts/fetch_worldbank.py   # Récupère les données World Bank
python3 scripts/merge_data.py        # Fusionne → src/data/indicators.json
```

## 📁 Structure

```
ITWorldMap/
├── src/
│   ├── components/
│   │   ├── Map.tsx              # Carte Leaflet choropleth
│   │   ├── ColorLegend.tsx      # Légende de couleur
│   │   └── ScatterPlot.tsx      # Nuage de points D3.js
│   ├── data/
│   │   └── indicators.json      # Données par pays (ISO3)
│   ├── App.tsx                  # Layout principal
│   └── main.tsx                 # Point d'entrée
├── data/
│   ├── scripts/                 # Scripts ETL Python
│   ├── raw/                     # Données brutes (cachées)
│   └── processed/               # Données normalisées
├── .github/workflows/deploy.yml # CI/CD GitHub Pages
└── vite.config.ts
```

## 📝 Licence

MIT
