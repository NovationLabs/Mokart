# Headscale — Setup & Utilisation MoKart

Headscale est la version self-hosted du control plane Tailscale.
Les Pi utilisent le client Tailscale standard, mais pointent vers **ton** serveur au lieu de celui de Tailscale Inc.

---

## Architecture

```
[Pi Zero 2 W]  ──── WireGuard ────  [VPS mokart.novationlabs.fr]
                                          │
                                    Headscale (control plane)
                                    gère les clés, les routes, les nœuds
```

---

## 1. Installer Headscale sur le VPS

### Ajouter le container dans docker-compose.yml

```yaml
headscale:
  image: headscale/headscale:latest
  container_name: mokart-headscale
  restart: unless-stopped
  volumes:
    - ./headscale/config:/etc/headscale
    - ./headscale/data:/var/lib/headscale
  ports:
    - "8090:8080"   # API + control plane
  command: serve
```

### Créer le fichier de config minimal

```bash
mkdir -p headscale/config headscale/data
```

`headscale/config/config.yaml` :

```yaml
server_url: https://headscale.mokart.novationlabs.fr
listen_addr: 0.0.0.0:8080
metrics_listen_addr: 127.0.0.1:9090

private_key_path: /var/lib/headscale/private.key
noise:
  private_key_path: /var/lib/headscale/noise_private.key

db_type: sqlite3
db_path: /var/lib/headscale/db.sqlite

log:
  level: warn

dns_config:
  magic_dns: true
  base_domain: mokart.net
```

### Exposer via nginx (sous-domaine)

Dans ta config nginx sur le VPS :

```nginx
server {
    listen 443 ssl;
    server_name headscale.mokart.novationlabs.fr;

    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Puis certbot :
```bash
certbot --nginx -d headscale.mokart.novationlabs.fr
```

---

## 2. Créer un utilisateur et une pre-auth key

```bash
# Entrer dans le container
docker exec -it mokart-headscale headscale

# Créer l'utilisateur mokart
headscale users create mokart

# Générer une pre-auth key réutilisable (tous les Pi l'utilisent)
headscale preauthkeys create --user mokart --reusable --expiration 365d
```

La clé générée ressemble à :
```
852a9c4c694b46e2a72fe8972a5f4c3d8f2e1a0b
```

---

## 3. Remplir le .env

```bash
# Hash du mot de passe choisi pour l'installer
echo -n "ton_mot_de_passe" | sha256sum
# → copier le résultat dans INSTALL_PASSWORD_HASH

INSTALL_PASSWORD_HASH=<sha256_du_mdp>
HEADSCALE_AUTHKEY=852a9c4c694b46e2a72fe8972a5f4c3d8f2e1a0b
```

Puis redémarrer l'API :
```bash
docker restart mokart-api
```

---

## 4. Utilisation — installer un Pi

```bash
curl -fsSL https://mokart.novationlabs.fr/install.sh | bash
```

Le script va :
1. Demander le mot de passe MoKart
2. Le hasher en SHA256 et l'envoyer à `POST /installer/authkey`
3. Récupérer la pre-auth key Headscale
4. Lancer `tailscale up --login-server https://headscale.mokart.novationlabs.fr --authkey <key>`
5. Le Pi apparaît automatiquement dans Headscale, aucune action manuelle

---

## 5. Gérer les nœuds

```bash
docker exec -it mokart-headscale headscale nodes list
# ID  Hostname       IP             Status   Last seen
# 1   mokart-test    100.64.0.1     online   2m ago
# 2   mokart-kart1   100.64.0.2     online   5m ago

# Renommer un nœud
headscale nodes rename --identifier 1 mokart-test

# Supprimer un nœud
headscale nodes delete --identifier 2
```

---

## 6. Régénérer la pre-auth key (rotation)

```bash
# Expirer l'ancienne
headscale preauthkeys expire --user mokart --key 852a9c4c...

# Créer une nouvelle
headscale preauthkeys create --user mokart --reusable --expiration 365d
```

Mettre à jour `HEADSCALE_AUTHKEY` dans le `.env` et `docker restart mokart-api`.
Les Pi déjà connectés ne sont pas affectés — la key n'est utilisée qu'à l'enregistrement initial.
