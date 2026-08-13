# Changelog

## 2026.08.006 (2026-08-13)

### Added
- **Sélecteur d'année** (séries temporelles) : checkbox « Années fixes » → slider 1960-2025, carte/légende/quantiles/rangs/tooltips/fiche recolorés sur l'année (N/A si absentes), partageable en URL (`?year=`)
- **Comparaison de 2 pays** : bouton ➕ dans la fiche → 2ᵉ pays par clic ou recherche, tableau côte à côte (valeur/année/rang), échange ↕, highlight orange, `?c=FRA&compare=DEU`
- **Mode mobile** : panneaux en pleine largeur (≤ viewport), panneau de contrôle scrollable (55vh)
- Nouvel ETL `data/scripts/fetch_series.py` → `public/series.json` (8 indicateurs × 214 pays × 1960-2025, chargé à la demande, cache nginx 7 j)

### Fixed
- Fermeture propre du fichier series.json (cache mémoïsé + réessai en cas d'échec réseau)

### Changed
- Rangs de la fiche recalculés sur l'année sélectionnée (cohérence avec la carte)

## 2026.08.004 (2026-08-12)

### Added
- **Recherche de pays** (autocomplete FR/EN par nom ou code ISO3, drapeaux) avec flyTo animé et contour de sélection
- **Fiche pays** au clic sur la carte ou via la recherche : drapeau, nom localisé, rang mondial de l'indicateur actif, les 8 indicateurs avec valeur/année/rang
- **Tooltip enrichi** sur 3 lignes : nom + rang mondial, indicateur actif (valeur/année), PIB/habitant
- Pays sélectionné partageable dans l'URL (`?c=`)
- Dépendance `i18n-iso-countries` (noms FR/EN + drapeaux par code ISO3)

### Fixed
- Clic sur un pays de la carte inopérant : closure des handlers Leaflet figée sur l'index pays vide → `useRef` + `useCallback` stable
- 16 requêtes OSM 400 en console (tuiles hors-monde au zoom 2) → `bounds` Web Mercator sur le tileLayer, console propre

### Changed
- Panneau de contrôle toujours ouvert par défaut au chargement (recherche découverte)

## 2026.08.002 (2026-08-12)

### Fixed
- GeoJSON des frontières simplifié (14,6 Mo → 870 Ko) via mapshaper `-simplify 8% keep-shapes` ; MIME `application/geo+json` + gzip nginx (les `.geojson` étaient servis en octet-stream : non compressés, non cachés par Cloudflare)
- Contrôle de zoom Leaflet recouvert par le panneau → déplacé en haut à droite
- Refetch du GeoJSON (14 Mo) à chaque changement de langue → fetch une seule fois
- Corrélation du scatter calculée sur les valeurs affichées (log si axe log) au lieu des valeurs brutes
- Dockerfile : node:20 (EOL) → node:22-alpine ; workflow Pages : node 22

### Added
- État synchronisé dans l'URL (`?mode=&a=&b=&x=&y=&cables=&lang=`) : liens partageables, état conservé au refresh
- Rang mondial dans les tooltips (`Mali: 25.2M (2025) · #57/214`)
- Bouton réinitialiser la vue (🌐), panneaux repliables (état persisté en localStorage)
- Disclaimer persisté (localStorage)
- Overlay « Chargement de la carte… » pendant le chargement des frontières
- Tooltip de plage sur la légende quantiles ; footer sources déplacé au-dessus de la légende

### Changed
- `strict: true` dans tsconfig.app.json
- Dépendances mortes supprimées (papaparse, tailwindcss/@tailwindcss/vite) ; assets morts supprimés
- `fmt()` mutualisé dans `src/utils/format.ts` ; `aria-pressed` sur les boutons de mode
- README : section Features ajoutée sous l'intro

### Hotfix 2026.08.002-c1
- Contrôle de zoom recouvert par la bannière disclaimer au premier chargement → décalé sous la bannière via `body.itwm-disclaimer` (CSS)

## 2026.08.001 (2026-08-01)

### Changed
- Port d'écoute par défaut changé de 3001 à 8003 (docker-compose, install.sh, README, .env.example)
- Version mise à jour à 2026.08.001 (VERSION, package.json, package-lock.json, index.html)
- Ajout du fichier .env.example avec PORT=8003
- Ajout du fichier VERSION contenant 2026.08.001
- Mise à jour du README : port 8003, version 2026.08.001, lien releases GitHub
- Remote Git passé en SSH (git@github.com:LostInTheBugs/ITWorldMap.git)
