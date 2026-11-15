# Agent IA

## Le problème

L'agent garde le fil de la conversation. Pour ça, il rangeait l'historique en mémoire sous un identifiant. Cet identifiant était calculé à partir du premier message de la conversation.

Prenons deux personnes qui ouvrent ai.mokart.fr et tapent bonjour. Elles obtiennent le même identifiant. Elles partagent donc la même mémoire. La deuxième peut demander à l'agent de résumer ce qui a été dit plus haut, et l'agent lui raconte la conversation de la première. Si la première a parlé de sa santé ou de son adresse, c'est une fuite de données personnelles. Le premier message le plus courant étant justement bonjour, ça arriverait très vite.

En plus, cette mémoire ne se vidait jamais. Elle grossissait jusqu'au redémarrage du service.

L'agent est public et chaque message coûte de l'argent sur notre clé LLM. Il n'y avait aucune limite de taille ni de fréquence. Un script pouvait envoyer des milliers de messages énormes et vider notre crédit en une nuit.

Les erreurs du LLM étaient renvoyées telles quelles dans le chat. Ces messages peuvent contenir l'URL du fournisseur ou des détails sur la clé.

Enfin, la page chargeait ses scripts depuis un CDN sans version précise. Si ce paquet est un jour piraté, le code piraté tourne directement chez nos utilisateurs.

## Ce qu'on a changé

L'agent ne garde plus aucune mémoire côté serveur. Le navigateur envoie déjà tout l'historique à chaque message, donc on s'en sert directement. Chaque utilisateur a sa propre conversation, point. Et plus rien ne s'accumule en mémoire.

L'historique est contrôlé avant d'aller au LLM. On garde les vingt derniers messages, chacun de quatre mille caractères au plus, et la requête entière ne dépasse pas soixante quatre kilo-octets. Seuls les rôles user et assistant sont acceptés. Personne ne peut donc glisser un faux message système pour détourner l'agent. Le dernier message doit venir de l'utilisateur.

Le front public limite chaque adresse IP à vingt messages toutes les dix minutes. On peut régler ça avec CHAT_RATE_MAX et CHAT_RATE_WINDOW_S.

Les erreurs du LLM partent dans les logs. L'utilisateur voit juste un message disant de réessayer.

Les scripts du CDN ont maintenant une version figée et une empreinte SRI. Le navigateur vérifie l'empreinte avant d'exécuter le fichier. Si le fichier change, il refuse de le lancer. Les dépendances Python du front ont aussi des versions figées.

La page affiche maintenant que l'utilisateur parle à une IA et qu'il ne doit pas partager de données personnelles. C'est une obligation de l'AI Act européen depuis le 2 août 2026, pour tout système qui discute avec des personnes.

## Ce qu'il nous reste à faire

L'agent reste ouvert sans compte. Pour le réserver à nos utilisateurs, il faudra le brancher sur le même jeton que l'app. Il faut aussi mettre un plafond de dépense mensuel directement chez notre fournisseur LLM. C'est la seule protection qui marche même si tout le reste lâche.
