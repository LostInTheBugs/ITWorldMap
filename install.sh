#!/bin/bash
# ITWorldMap — Script d'installation
# Usage : curl -sSL https://raw.githubusercontent.com/LostInTheBugs/ITWorldMap/main/install.sh | bash
set -e

APP_DIR="/opt/itworldmap"
PORT="${PORT:-3001}"

echo "🌍 ITWorldMap — Installation"
echo "============================"

# Git + Docker requis
command -v git >/dev/null 2>&1 || { echo "❌ git requis"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker requis"; exit 1; }

# Cloner ou mettre à jour
if [ -d "$APP_DIR/.git" ]; then
    echo "📦 Mise à jour depuis GitHub..."
    cd "$APP_DIR"
    git fetch origin main
    git reset --hard origin/main
else
    echo "📦 Clonage du dépôt..."
    sudo mkdir -p "$APP_DIR"
    sudo chown "$(whoami):$(whoami)" "$APP_DIR"
    git clone https://github.com/LostInTheBugs/ITWorldMap.git "$APP_DIR"
    cd "$APP_DIR"
fi

# Build + lancement Docker
echo "🐳 Build Docker..."
PORT=$PORT docker compose up -d --build

# Vérification
sleep 2
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q 200; then
    echo ""
    echo "✅ ITWorldMap installé !"
    echo "   ➜ http://localhost:$PORT"
else
    echo ""
    echo "⚠️  Conteneur démarré mais pas encore prêt. Vérifie avec :"
    echo "   docker logs itworldmap"
fi
