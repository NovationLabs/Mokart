[![Mokart CI](https://github.com/novationlabs/mokart/actions/workflows/build.yml/badge.svg)](https://github.com/novationlabs/mokart/actions)


##  Stack

- **Frontend**: React (TSX), Tailwind CSS
- **Backend**: Python (FastAPI)
- **Infrastructure**: Docker, Docker Compose, Nginx


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

**Run with Docker Compose**
   ```bash
   # Development
   docker-compose up --build

   # Production
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

**Access the Application**
- Development :
   - Web App: [http://localhost:8080](http://localhost:8080)
   - API: [http://localhost:8081](http://localhost:8081)

- Production :
   - Web App: [http://localhost:9980](http://localhost:9980)
   - API: [http://localhost:9981](http://localhost:9981)

## Team

- **Léo GREGORI**
- **Clément DORGE**
- **Selim BOUASKER**
- **Anthony COLOMBANI-GAILLEUR**
