# CI — Intégration continue

La CI de Mokart tourne sur GitHub Actions. Chaque push ou pull request sur `dev` ou `production` déclenche les vérifications (lint, build, sécurité) avant le déploiement sur Railway. La branche `production` est déployée en production, `dev` en environnement de développement.

| Workflow | Déclencheur | Ce qu’il fait |
| --- | --- | --- |
| Docker Build Dev (`build_dev.yml`) | Push / PR sur `dev` | Build les images Docker (application et backup) et vérifie le support des dumps PostgreSQL répétables |
| Docker Build Prod (`build_prod.yml`) | Push / PR sur `production` | Build et lance la stack de production, vérifie la santé de l’API et que les fronts répondent |
| Lint & Build (`lint.yml`) | Push sur `dev` / `production`, PR | Lint Python (Ruff) ; typecheck et build des fronts `app` et `web` (Node 24) |
| Security CI (`security-ci.yml`) | PR / push, tous les lundis à 05:17 | Détecte les secrets (Gitleaks), audite les dépendances (pip-audit, npm audit), analyse le code (CodeQL), scanne les conteneurs (Trivy), calcule un score de conformité (minimum 60) |
| Security CD (`security-cd.yml`) | Push, tous les jours à 06:43, après déploiement | Porte de sécurité avant déploiement ; vérifie les environnements en ligne et ouvre une issue GitHub en cas d’écart détecté |
