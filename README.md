<div align="center">
  <a href="https://mokart.fr"><img src=".github/mokart-logo.png" alt="Mokart" width="360" /></a>
</div>

<div align="center">

![Docker](https://img.shields.io/badge/Docker-required-2496ED?logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

</div>

<div align="center">

[![Mokart Dev CI](https://github.com/novationlabs/mokart/actions/workflows/build_dev.yml/badge.svg)](https://github.com/novationlabs/mokart/actions)
[![Mokart Prod CI](https://github.com/novationlabs/mokart/actions/workflows/build_prod.yml/badge.svg)](https://github.com/novationlabs/mokart/actions)
[![Mokart Lint & Build](https://github.com/novationlabs/mokart/actions/workflows/lint.yml/badge.svg)](https://github.com/novationlabs/mokart/actions/workflows/lint.yml)

</div>

## Architecture

```
Mokart/
├── web/        # Public landing page (React + Tailwind)
├── app/        # Driver dashboard / web app (React + Tailwind)
├── api/        # Backend (Python · FastAPI)
├── db/         # PostgreSQL image with initial schema
├── ai-backend/ # Agent API
└── ai-front/   # Agent UI
```

## Quick Start

```bash
# Development
cp .env.example .env
docker compose up --build

# Local production configuration
docker compose -f docker-compose.prod.yml up --build -d

# Stop
docker compose down
docker compose -f docker-compose.prod.yml down
```

---

## Access

| Env | Service | URL |
|-----|---------|-----|
| Dev | Web | http://localhost:8080 |
| Dev | App | http://localhost:8000 |
| Dev | API | http://localhost:8081 |
| Dev | Agent API | http://localhost:8002 |
| Dev | Agent UI | http://localhost:8003 |
| Local prod | Web | http://localhost:8080 |
| Local prod | App | http://localhost:8000 |
| Local prod | API | http://localhost:8081 |

Railway déploie `dev` depuis la branche `dev` et `production` depuis la branche `production`.
Les changements partent d'une branche `feature/nom`, fusionnée dans `dev`, puis promue dans `production` après vérification. Voir [la configuration Railway](docs/railway.md).

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
- **Tom CLERC**
