#!/bin/bash

# Script de démarrage pour Mokart
# Usage: ./start.sh [build|rebuild|stop|clean|prod]

THRESHOLD_MB=1024
DISK_PATH="/"

get_free_mb() {
    df -BM "$DISK_PATH" | awk 'NR==2 {gsub("M","",$4); print $4}'
}

# STOP
if [ "$1" = "stop" ]; then
    echo "🛑 Arrêt des services..."
    docker-compose down
    echo "👋 Services arrêtés !"
    exit 0
fi

# CLEAN (destructif)
if [ "$1" = "clean" ]; then
    echo "🧹 Nettoyage complet de Docker..."
    docker-compose down --rmi all --volumes --remove-orphans
    docker-compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans
    docker system prune -af
    docker volume prune -f
    echo "✅ Nettoyage terminé !"
    exit 0
fi

# PRODUCTION
if [ "$1" = "prod" ]; then
    echo "🚀 Démarrage en mode production..."

    # Arrêt des conteneurs existants
    docker-compose -f docker-compose.prod.yml down

    # Vérification de l'espace disque
    FREE_MB=$(get_free_mb)
    echo "💽 Espace disque libre : ${FREE_MB}Mo"

    if [ "$FREE_MB" -lt "$THRESHOLD_MB" ]; then
        echo "⚠️  ATTENTION: Moins de 1Go d'espace disque disponible (${FREE_MB}Mo)"
        echo "🔧 Nettoyage des images dangling..."
        docker image prune -f

        echo ""
        read -r -p "⚠️  Espace limité ! Voulez-vous continuer malgré le risque ? (Entrée pour continuer, Ctrl+C pour annuler) "
        echo ""
    else
        echo "✅ Espace suffisant → aucun prune nécessaire"
    fi

    echo "🔨 Construction et démarrage des services de production..."
    docker-compose -f docker-compose.prod.yml up -d --build

    # Attente
    echo "⏳ Attente du démarrage des services..."
    sleep 10

    echo "📊 État des services:"
    docker-compose -f docker-compose.prod.yml ps

    echo ""
    echo "✅ Services de production démarrés !"
    echo "🌐 Frontend: http://localhost:9980"
    echo "🔧 Backend API: http://localhost:9981"
    echo ""

    read -r -p "Appuyez sur Entrée pour arrêter tous les services..."

    echo "🛑 Arrêt des services de production..."
    docker-compose -f docker-compose.prod.yml down
    echo "👋 Au revoir !"
    exit 0
fi

# Arrêt des conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# BUILD
if [ "$1" = "build" ]; then
    FREE_MB=$(get_free_mb)
    echo "💽 Espace disque libre : ${FREE_MB}Mo"

    if [ "$FREE_MB" -lt "$THRESHOLD_MB" ]; then
        echo "⚠️  ATTENTION: Moins de 1Go d'espace disque disponible (${FREE_MB}Mo)"
        read -r -p "⚠️  Espace limité ! Voulez-vous continuer, cela entrainera la suppression des anciennes images Docker ? (Entrée pour continuer, Ctrl+C pour annuler) "
        echo "🔧 Nettoyage des images dangling..."
        docker-compose down --rmi all --volumes --remove-orphans
        docker system prune -af
        docker volume prune -f
        echo ""
        echo ""
    else
        echo "✅ Espace suffisant → aucun prune nécessaire"
    fi

    echo "🔨 Construction et démarrage des services..."
    docker-compose up -d --build

elif [ "$1" = "rebuild" ]; then
    echo "🔨 Reconstruction complète des services..."
    docker-compose down --rmi all
    docker-compose up -d --build --no-cache --force-recreate

else
    echo "🚀 Démarrage des services existants..."
    docker-compose up -d
fi

# Attente
echo "⏳ Attente du démarrage des services..."
sleep 5

echo "📊 État des services:"
docker-compose ps

echo ""
echo "✅ Services démarrés !"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:8081"
echo ""

read -r -p "Appuyez sur Entrée pour arrêter tous les services..."

echo "🛑 Arrêt des services..."
docker-compose down
echo "👋 Au revoir !"
