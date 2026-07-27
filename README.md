# 🌍 ITWorldMap

[![GitHub tag](https://img.shields.io/github/v/tag/LostInTheBugs/ITWorldMap?label=version)](https://github.com/LostInTheBugs/ITWorldMap/tags)
[![Deploy](https://github.com/LostInTheBugs/ITWorldMap/actions/workflows/deploy.yml/badge.svg)](https://github.com/LostInTheBugs/ITWorldMap/actions)

> ⚠️ **Disclaimer**: This application is a **demo/test**. Data may contain errors or outdated values. **Do not use for decision-making purposes.**

Interactive world map visualizing IT indicators (Internet, mobile, broadband, secure servers) crossed with socio-economic data (population, GDP, CO₂, electricity access).

🌐 **Demo**: [itworldmap.cloudfr.net](https://itworldmap.cloudfr.net/)

## 📊 Data Sources

All indicators are sourced from the **World Bank API** ([api.worldbank.org](https://api.worldbank.org)).  
Data vintage varies by country and indicator, ranging from **1990 to 2025** (most recent available year per country).
Map tiles: **OpenStreetMap** contributors.

| Category | Indicator | Source |
|----------|-----------|--------|
| 👥 Population | Total population | World Bank |
| 💰 Economy | GDP per capita (US $) | World Bank |
| 🏭 Environment | CO₂ emissions per capita | World Bank |
| 🌐 Internet | Internet users (% pop.) | World Bank |
| 📱 Mobile | Mobile subscriptions /100 pop. | World Bank |
| 🛜 Broadband | Fixed broadband /100 pop. | World Bank |
| ⚡ Electricity | Electricity access (%) | World Bank |
| 🔒 Security | Secure servers /M pop. | World Bank |

## 📦 Quick Install (Docker)

```bash
curl -sSL https://raw.githubusercontent.com/LostInTheBugs/ITWorldMap/main/install.sh | bash
```

The app will be available at `http://localhost:3001`.

Optional environment variables:

```bash
ITWM_DIR=/opt/itworldmap ITWM_PORT=8080 bash install.sh
```

Or manually:

```bash
git clone https://github.com/LostInTheBugs/ITWorldMap.git
cd ITWorldMap
PORT=3001 docker compose up -d --build
```

## 🛠️ Development

```bash
npm install        # Install dependencies
npm run dev        # Dev server (http://localhost:5173)
npm run build      # Production build
```

### Updating data

```bash
cd data
python3 scripts/fetch_worldbank.py   # Fetch World Bank data
python3 scripts/merge_data.py        # Merge → src/data/indicators.json
```

## 🐳 Docker Deployment

```bash
# Build + start
PORT=3001 docker compose up -d --build

# Logs
docker logs itworldmap

# Update
cd ITWorldMap
git pull origin main
PORT=3001 docker compose up -d --build
```

## 🔖 Versioning

Format: **`YYYY.MM.NNN`** (year.month.increment)  
Example: `2026.07.001` → July 2026, iteration 001.

Each release:
- Update `<meta name="version" content="YYYY.MM.NNN">` in `index.html`
- Create a Git tag: `git tag -a YYYY.MM.NNN -m "YYYY.MM.NNN" && git push origin YYYY.MM.NNN`

## 🌐 Internationalization

The app supports **French** (default) and **English**. Use the language selector in the top-left panel.

## 📁 Structure

```
ITWorldMap/
├── src/
│   ├── components/
│   │   ├── Map.tsx              # Map orchestrator (single/dual/ratio modes)
│   │   ├── MapPanel.tsx         # Individual map panel
│   │   ├── ColorLegend.tsx      # Color legend with quantiles
│   │   └── ScatterPlot.tsx      # D3.js scatter plot with Pearson correlation
│   ├── i18n/
│   │   ├── translations.ts      # FR/EN translation strings
│   │   └── LangContext.tsx       # Language context provider
│   ├── data/
│   │   ├── indicators.json      # Country data (ISO3)
│   │   └── types.ts             # Shared TypeScript types
│   ├── App.tsx                  # Main layout + controls
│   └── main.tsx                 # Entry point
├── data/
│   ├── scripts/                 # Python ETL scripts
│   │   ├── fetch_worldbank.py   # World Bank API fetcher
│   │   └── merge_data.py        # Merge → src/data/
│   ├── raw/                     # Raw API responses (gitignored)
│   └── processed/               # Normalized data (gitignored)
├── public/
│   └── countries.geojson        # Country borders
├── .github/workflows/deploy.yml # CI/CD GitHub Pages
├── Dockerfile                   # Multi-stage Node + Nginx
├── docker-compose.yml           # Docker service (port 3001)
├── nginx.conf                   # Nginx config (SPA fallback, security headers)
├── install.sh                   # One-liner install script
└── vite.config.ts
```

## 📝 License

MIT
