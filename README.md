[![Mokart Dev CI](https://github.com/novationlabs/mokart/actions/workflows/build_dev.yml/badge.svg)](https://github.com/novationlabs/mokart/actions)
[![Mokart Prod CI](https://github.com/novationlabs/mokart/actions/workflows/build_prod.yml/badge.svg)](https://github.com/novationlabs/mokart/actions)

## Architecture

```
website/
├── web/        # Public landing page (React + Tailwind)
├── app/        # Driver dashboard / web app (React + Tailwind)
├── api/        # Backend (Python · FastAPI)
└── nginx/      # Reverse proxy
```

## Quick Start

**Script de démarrage recommandé**
```bash
# Démarrage rapide (développement)
./start.sh

# Construction et démarrage
./start.sh build

# Reconstruction complète
./start.sh rebuild

# Mode production
./start.sh prod

# Arrêter les services
./start.sh stop

# Nettoyage complet
./start.sh clean
```

**Docker Compose direct**
```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up --build -d
```

---

## Access

| Env | Service | URL |
|-----|---------|-----|
| Dev | Web + App | http://localhost:8080 |
| Dev | API | http://localhost:8081 |
| Prod | Web + App | http://localhost:9980 |
| Prod | API | http://localhost:9981 |

---

## Benchmarks consommation

| Board | Durée | Conso | Python | SSH | Display | Temp | Ventilo |
|---|---|---|---|---|---|---|---|
| RPi Zero 2W | 5 min | 60 mWh | ✅ 1x | ❌ | ❌ | — | ❌ |
| RPi Zero 2W | 50 min | 685 mWh | ✅ 1x | ❌ | ❌ | — | ❌ |
| RPi Zero 2W | 5 min | 155 mWh | ✅ 2x | ✅ 3x | ✅ (blanc) | — | ❌ |
| RPi Zero 2W | 25 min | 745 mWh | ✅ 1x | ✅ 2x + btop | ✅ | 65°C | ❌ |
| RPi Zero 2W | 25 min | 860 mWh | ✅ 1x | ✅ 2x + btop | ✅ | 45°C | ✅ |
| RPi 4 | 24 min | 1000 mWh | ❌ | — | ✅ | — | ❌ |

## Team

- **Léo GREGORI**
- **Clément DORGE**
- **Selim BOUASKER**
- **Anthony COLOMBANI-GAILLEUR**
