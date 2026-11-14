# 04 — Frontends

## Vitrine `web/`

React sert `mokart.fr` et `dev.mokart.fr`. `web/src/App.tsx` choisit la page selon le chemin : accueil, About, Soon, Privacy, Terms et Style Guide. L'accueil courant est dans `web/src/pages/Home.tsx` et utilise `Main.css` et `Refined.css`. Le lien vers le tableau de bord vient de `web/src/dashboardUrl.ts`.

`web/src/components/home/`, plusieurs hooks d'animation, `Reveal`, `CountUp` et `Marquee` appartiennent à une ancienne version de la vitrine : aucun de ces composants n'est importé par les pages courantes. Leur retrait est traité séparément dans l'issue #92. Les fichiers de `web/public/prototype/` utilisés par l'accueil et About doivent être conservés.

## Tableau de bord `app/`

`app/src/App.tsx` définit les routes. `/login` est accessible sans session ; les autres pages du tableau de bord demandent la présence d'une session dans `localStorage`. `/hud/:sessionId` est une route publique, sans `AppLayout`.

`AuthPage` appelle l'API pour l'inscription et la connexion. `Home` utilise `/dashboard/data`, mais cette route renvoie encore des valeurs synthétiques. `SessionsPage` utilise `src/data/mock.ts`. `AnalysisPage` et certaines vues de sessions utilisent l'API ; `SimulationPage` affiche une simulation. `LivePage` utilise aussi des données de démonstration. Vérifier la source des données de chaque autre page avant de la présenter comme intégrée.

En production Railway, `app/Dockerfile.railway` configure `REACT_APP_API_URL=/api`, servi par Nginx vers l'API privée. En local, l'API est sur `localhost:8081`. Le front ajoute le JWT aux appels passés par `authFetch` ; le HUD fait un appel public distinct. Les permissions de navigation du front sont définies dans `app/src/types/user.ts`, mais le backend reste l'autorité de sécurité.
