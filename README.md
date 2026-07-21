# 🌍 ITWorldMap

[![GitHub tag](https://img.shields.io/github/v/tag/LostInTheBugs/ITWorldMap?label=version)](https://github.com/LostInTheBugs/ITWorldMap/tags)
[![Deploy](https://github.com/LostInTheBugs/ITWorldMap/actions/workflows/deploy.yml/badge.svg)](https://github.com/LostInTheBugs/ITWorldMap/actions)

Carte du monde interactive visualisant des indicateurs IT (IPv6, Internet, IA) croisés avec des données socio-économiques (population, PIB, CO₂).

## 📦 Installation rapide (Docker)

```bash
curl -sSL https://raw.githubusercontent.com/LostInTheBugs/ITWorldMap/main/install.sh | bash
```

L'application sera accessible sur `http://localhost:3001`.

Variables d'environnement optionnelles :

```bash
ITWM_DIR=/opt/itworldmap ITWM_PORT=8080 bash install.sh
```

Ou manuellement :

```bash
git clone https://github.com/LostInTheBugs/ITWorldMap.git
cd ITWorldMap
PORT=3001 docker compose up -d --build
```

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

## 🐳 Déploiement Docker

```bash
# Build + lancement
PORT=3001 docker compose up -d --build

# Logs
docker logs itworldmap

# Mise à jour
cd ITWorldMap
git pull origin main
PORT=3001 docker compose up -d --build
```

## 🔖 Versioning

| Changement | Version | Exemple |
|---|---|---|
| Nouvelle fonctionnalité | v1.x.0 | v1.0.0 → v1.1.0 |
| Correction / amélioration | v1.0.x | v1.0.0 → v1.0.1 |
| Refonte majeure | v2.0.0 | Sur décision |

**Chaque release** :
- Mettre à jour `<meta name="version" content="vX.Y.Z">` dans `index.html`
- Créer un tag Git : `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`

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
│   │   ├── fetch_worldbank.py   # API World Bank
│   │   └── merge_data.py        # Fusion → src/data/
│   ├── raw/                     # Données brutes (cachées)
│   └── processed/               # Données normalisées
├── .github/workflows/deploy.yml # CI/CD GitHub Pages
├── Dockerfile                   # Build multi-stage Node + Nginx
├── docker-compose.yml           # Service Docker (port 3001)
├── nginx.conf                   # Configuration Nginx (SPA fallback)
├── install.sh                   # Script d'installation one-liner
└── vite.config.ts
```

## 📝 Licence

MIT
