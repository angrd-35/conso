# Déploiement et migration vers le VPS

Cible : `/opt/stacks/apps/conso` sur le VPS (Traefik + Authelia, réseau externe `proxy`).
Images : `ghcr.io/angrd-35/conso-backend` et `ghcr.io/angrd-35/conso-frontend`, construites
par `.github/workflows/docker.yml` (tags `sha-xxxxxxx` à chaque push sur `main`, `X.Y.Z` sur un tag `vX.Y.Z`).
Aucun secret dans Git : l'appli n'en a pas ; le seul fichier local au VPS est `.env` (tag d'image).

## 1. Préparation (une fois)

1. Pousser le code sur GitHub et vérifier que le workflow a publié les deux images.
2. Rendre les paquets GHCR publics (GitHub → Packages → *Package settings* → *Change visibility*),
   **ou** garder des paquets privés et faire sur le VPS un `docker login ghcr.io` avec un PAT
   limité à `read:packages` (stocké dans `~/.docker/config.json`, jamais dans Git).
3. Authelia : ajouter dans `access_control.rules` de `/opt/stacks/authelia/config/configuration.yml`

   ```yaml
   - domain: conso.angrd.ovh
     policy: two_factor
   ```

   puis `docker compose -f /opt/stacks/authelia/compose.yaml restart authelia`
   (adapter au nom réel du fichier compose).
4. Authelia : l'utilisateur doit appartenir au groupe `conso-users` (sinon 403 de l'appli),
   ou régler `AUTH_REQUIRED_GROUP: ""` dans `compose.yaml` pour ne s'appuyer que sur `access_control`.

## 2. Premier déploiement (base vide)

```bash
ssh vps
sudo mkdir -p /opt/stacks/apps/conso && cd /opt/stacks/apps/conso
# copier compose.yaml (scp depuis le dépôt) puis :
echo 'CONSO_TAG=sha-xxxxxxx' > .env        # tag publié par le workflow
docker compose pull
docker compose create                      # crée le volume conso_conso_data, sans démarrer
```

Ne pas lancer `up -d` avant l'import si on veut éviter une base vide à écraser
(sinon `docker compose down` avant l'import, c'est équivalent).

## 3. Import des données du Dell

Tout l'état est dans le volume `/app/data` : `conso.db` (SQLite) et `uploads/` (photos).

**Sur le Dell** — arrêter le backend pour obtenir un fichier cohérent (SQLite en WAL), puis archiver :

```bash
docker volume ls | grep conso_data          # relever le nom exact, ex. conso_conso_data
docker compose stop backend frontend         # dans le dossier de l'ancien compose
docker run --rm -v <NOM_VOLUME>:/data:ro -v "$PWD":/out alpine \
  tar czf /out/conso-data.tgz -C /data .
sha256sum conso-data.tgz
```

**Transfert** (Tailscale) : `scp conso-data.tgz vps:/tmp/` (depuis le Dell s'il est sur le tailnet,
sinon via le poste de travail). Vérifier le `sha256sum` côté VPS, puis supprimer l'archive après import
(elle contient les données).

**Sur le VPS** :

```bash
cd /opt/stacks/apps/conso
docker compose down 2>/dev/null || true
docker run --rm -v conso_conso_data:/data -v /tmp:/in:ro alpine \
  sh -c 'tar xzf /in/conso-data.tgz -C /data && chown -R 1000:1000 /data'
docker compose up -d
docker compose logs -f conso-backend         # migrations Prisma + "successfully started"
```

Le conteneur tourne en utilisateur `node` (uid 1000) : d'où le `chown`.
Au démarrage, `prisma migrate deploy` applique les éventuelles migrations manquantes.

## 4. Test avant bascule DNS

Sans toucher au DNS, depuis le poste de travail, forcer la résolution vers l'IP publique du VPS :

```bash
# /etc/hosts (sudo) :  <IP_VPS>  conso.angrd.ovh
curl -I https://conso.angrd.ovh/            # 302 vers auth.angrd.ovh (Authelia) = middleware actif
```

Puis dans le navigateur : connexion Authelia (2FA), vérifier la liste des véhicules, une photo,
l'ajout d'un plein, les statistiques, la déconnexion (retour sur le portail). Contrôles côté VPS :

```bash
docker compose ps                            # backend "healthy"
docker compose exec conso-backend id         # uid=1000(node)
docker inspect $(docker compose ps -q conso-backend) --format '{{json .NetworkSettings.Networks}}' | grep -c proxy   # 0 attendu
```

Retirer ensuite la ligne de `/etc/hosts`.

## 5. Bascule

1. Dell : les données ont été arrêtées à l'étape 3. Si de nouvelles saisies ont eu lieu depuis,
   refaire l'export/import (étape 3) juste avant la bascule.
2. OVH : créer l'enregistrement `A conso.angrd.ovh → <IP_VPS>` (TTL court).
3. Vérifier `https://conso.angrd.ovh` (certificat wildcard, Authelia, données).
4. Garder le Dell **arrêté mais intact** (volume non supprimé) quelques jours comme sauvegarde/rollback.

**Rollback** : supprimer l'enregistrement A (ou le rediriger vers l'ancienne entrée) et relancer
`docker compose up -d` sur le Dell. Les données saisies sur le VPS entre-temps ne seraient pas
reprises : à exporter avec la même procédure inversée si nécessaire.

## 6. Mises à jour ultérieures

```bash
cd /opt/stacks/apps/conso
sed -i 's/^CONSO_TAG=.*/CONSO_TAG=sha-nouveau/' .env
docker compose pull && docker compose up -d
```

Sauvegarde : `docker run --rm -v conso_conso_data:/data:ro -v "$PWD":/out alpine tar czf /out/conso-$(date +%F).tgz -C /data .`
