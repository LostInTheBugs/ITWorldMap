# Changelog

## 2026.08.018 (2026-08-14)

### Added
- **Popup câbles sous-marins** : clic sur un câble → nom + longueur géodésique (ex. « Pan-American Crossing — 6 653 km (approx.) »). Corrections d'empilement : pane Leaflet dédié (zIndex 500) pour que les câbles passent au-dessus des pays.
- **Export PNG** : bouton 📷 dans l'en-tête → capture 2× de la carte (carte + légende, `itworldmap-YYYY-MM-DD.png`), fonctionne en modes single, dual et ratio.

## 2026.08.016 (2026-08-13)

### Added
- **Mobile** : mode dual empilé verticalement sur téléphone (2 cartes pleine largeur au lieu de côte à côte) ; fiche pays en **bottom-sheet** (panneau glissant du bas, coins arrondis, 42vh max, scrollable).
- **PWA** (`vite-plugin-pwa`) : manifest + service worker → site **installable** sur l'écran d'accueil (plein écran, icône globe), **hors-ligne** (index, assets, geojson, series.json, câbles en cache ; tuiles OSM en cache borné 30 j/800), mise à jour auto du service worker. Icônes 192/512 + maskable générées.

## 2026.08.014 (2026-08-13)

### Added
- **Modes d'échelle de la légende** (sélecteur « Échelle » dans le panneau) : quantiles (auto), classes égales, valeurs fixes par indicateur, moyenne au centre, médiane au centre, personnalisé (seuils saisis par l'utilisateur). Partageable en URL (`?scale=` + `?custom=`). En mode « années fixes », les modes fixes/personnalisé gardent la légende stable pendant la lecture automatique.
- Nouveau module `src/utils/scale.ts` (seuils partagés carte + légende).

### Fixed
- **Crash de l'application** quand le mode personnalisé recevait moins de 5 seuils (lecture hors bornes dans la légende → React démontait l'interface). La légende et la colorisation s'adaptent au nombre de seuils saisis.

## 2026.08.012 (2026-08-13)

### Added
- **Vitesse de lecture réglable** : sélecteur 0.5×/1×/2×/4× à côté du bouton ▶, modifiable pendant la lecture (300 ms à 1,2 s par année).

## 2026.08.010 (2026-08-13)

### Added
- **Lecture automatique des années (bouton ▶/⏸)** : animation de l'évolution année par année (600 ms/an) jusqu'à la dernière année disponible, à côté du slider « Année ». En mode dual, les deux cartes défilent en synchronisation. Arrêt automatique en fin de plage ou à la désactivation du mode années fixes. URL partageable à tout instant (`?year=`).

## 2026.08.008 (2026-08-13)

### Added
- **Scatter interactif** : clic sur un point du graphique → sélection du pays (fiche + zoom + URL `?c=`), point sélectionné en bleu (orange en comparaison) avec liseré blanc, curseur pointer.
- **Double année en mode dual** : second slider « Année (carte 2) » (orange) — chaque carte a sa propre année, partageable `?year=2000&yearB=2022`. Tooltips, rangs et couleurs cohérents par carte.
- **ETL hebdo automatique** (cron dimanche 4h, VM Hermes) : refresh World Bank → `indicators.json` + `series.json` → build + commit/push + déploiement serveur-prod si données changées (silencieux sinon). Purge du cache `data/raw/` pour forcer un fetch frais.
- **Watchdog serveur-prod** : alerte down/up du serveur et du site (5 min).

### Changed
- Migration prod ancien-serveur → serveur-prod (Traefik docker + Let's Encrypt, DNS Cloudflare mis à jour). ancien-serveur nettoyé (conteneur, image, répertoire).

### Added
- **Sélecteur d'année** (séries temporelles) : checkbox « Années fixes » → slider 1960-2025, carte/légende/quantiles/rangs/tooltips/fiche recolorés sur l'année (N/A si absentes), partageable en URL (`?year=`)
- **Comparaison de 2 pays** : bouton ➕ dans la fiche → 2ᵉ pays par clic ou recherche, tableau côte à côte (valeur/année/rang), échange ↕, highlight orange, `?c=FRA&compare=DEU`
- **Mode mobile** : panneaux en pleine largeur (≤ viewport), panneau de contrôle scrollable (55vh)
- Nouvel ETL `data/scripts/fetch_series.py` → `public/series.json` (8 indicateurs × 214 pays × 1960-2025, chargé à la demande, cache nginx 7 j)

### Fixed
- Fermeture propre du fichier series.json (cache mémoïsé + réessai en cas d'échec réseau)

### Changed
- Rangs de la fiche recalculés sur l'année sélectionnée (cohérence avec la carte)

### Hotfix 2026.08.006-c1
- Mode années fixes via `?year=` au chargement : les séries n'étaient jamais chargées (loadSeries uniquement déclenché par le toggle) → « Chargement des données historiques… » infini. Ajout d'un `useEffect` qui charge les séries au montage quand `yearMode` est actif.

### Hotfix 2026.08.006-c2
- **Scatter vide** : double log sur les positions des points (`x(tx(v))` où l'échelle est déjà log) introduit par le fix de corrélation 2026.08.002 → tous les points écrasés hors du graphique. Les cercles reçoivent désormais les valeurs brutes ; `tx/ty` ne servent qu'à la corrélation.
- **FlyTo dans le vide** : les centroïdes calculés sur le GeoJSON simplifié par mapshaper sont faux — la simplification produit des géométries invalides pour les multipolygones (aires ~4π, points n'importe où : France → Pacifique, USA → Atlantique, Russie → Antarctique). Nouvelle table `src/data/centroids.json` (239 pays) calculée sur le GeoJSON ORIGINAL avec le centroïde du plus grand polygone (métropole pour la France, continent pour les USA…).

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
