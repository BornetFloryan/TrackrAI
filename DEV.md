# DEV - Lancement et tests TrackrAI

Ce document resume les commandes utiles pour lancer TrackrAI en developpement, en production et en CI. Le projet est prevu pour fonctionner sous Linux natif ou sous Windows avec WSL 2 / Docker Desktop.

## Prerequis

- Docker 24 ou plus recent
- Docker Compose v2 (`docker compose`)
- Git
- Pour l'ESP32 : Arduino IDE ou PlatformIO, avec l'adresse IP de la machine Docker dans le firmware

## Lancement en developpement

Depuis la racine du depot :

```bash
docker compose -f docker-compose.dev.yml up --build
```

Services exposes :

- Frontend Vite : http://localhost:5173
- API Node : http://localhost:4567/trackrapi
- Serveur central TCP : localhost:29000
- Serveur analyse video WebSocket : ws://localhost:6000
- MongoDB : localhost:27017

Le frontend de developpement installe ses dependances dans un volume Docker dedie afin d'eviter les problemes de binaires npm entre Windows, Linux et les conteneurs.

## Lancement en production locale

```bash
docker compose -f docker-compose.yml up --build
```

Services exposes :

- Frontend servi par Nginx : http://localhost:8080
- API Node : http://localhost:4567/trackrapi
- Serveur central TCP : localhost:29000
- Serveur analyse video : ws://localhost:6000

En production, le frontend est compile puis servi par Nginx. L'API et MongoDB restent des services separes.

## Arret

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.yml down
```

## Reset complet de la base

Attention : cette commande supprime les donnees MongoDB du compose concerne.

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

Pour la production locale :

```bash
docker compose -f docker-compose.yml down -v
docker compose -f docker-compose.yml up --build
```


## Configuration ESP32

L'ESP32 utilise WiFiManager. Pour reconfigurer le WiFi, l'adresse du serveur ou la clé module :

1. Allumer l'ESP32.
2. Maintenir **BOOT** environ 5 secondes au démarrage pour effectuer un reset de configuration.
3. Se connecter au point d'accès WiFi créé par l'ESP32 :

```text
Trackr-ESP32
```

4. Dans le portail WiFiManager, choisir le WiFi à utiliser et renseigner :

```text
Server host : IP de la machine qui lance Docker
Server port : 29000
```

Exemple :

```text
Server host : 192.168.31.100
Server port : 29000
```

5. Valider. L'ESP32 sauvegarde la configuration en mémoire flash et s'auto-enregistre au serveur central si nécessaire.

## Tests rapides avant demo

Verifier la configuration Docker :

```bash
docker compose -f docker-compose.dev.yml config --quiet
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.ci.yml config --quiet
```

Verifier l'API :

```bash
curl http://localhost:4567/trackrapi/health
```

Verifier le build frontend depuis le conteneur de developpement :

```bash
docker compose -f docker-compose.dev.yml exec frontend npm run build
```

Verifier la syntaxe des principaux fichiers API :

```bash
docker compose -f docker-compose.dev.yml exec trackr-api node --check controllers/auth.controller.js
docker compose -f docker-compose.dev.yml exec trackr-api node --check controllers/session.controller.js
docker compose -f docker-compose.dev.yml exec trackr-api node --check TrackrAPI.js
```

## Scenario de demo conseille

1. Se connecter en administrateur et affecter un coach a un sportif.
2. Se connecter en sportif, lancer une seance avec l'ESP32, observer les mesures en direct puis arreter la seance.
3. Ouvrir le detail de la seance : statistiques, score, stress, graphiques et GPS si disponible.
4. Se connecter en coach, ouvrir la page des sportifs suivis et acceder a la seance en direct si elle est active.
5. Comparer deux seances terminees depuis l'onglet Comparer.
6. Lancer une analyse video depuis la page Analyse video et verifier son apparition dans l'historique.


## Documentation API Swagger

La documentation Swagger est servie directement par l'API :

```text
http://localhost:4567/trackrapi/api-docs
http://localhost:5173/trackrapi/api-docs
```

Le JSON OpenAPI généré est disponible ici :

```text
http://localhost:4567/trackrapi/swagger.json
```

Pour tester les routes securisees :

1. appeler `POST /auth/signin` avec un utilisateur de demo ;
2. copier `data.token` dans `Authorize` / `jwt` ;
3. tester les routes protegees ;
4. appeler `POST /auth/refresh` avec `data.refreshToken` dans le body ou `x-refresh-token`.

Comptes de demo initialises en base :

- `admin` / `admin`
- `coach` / `coach`
- `test` / `azer`
- `thomas` / `thomas`
- `lea` / `lea`
- `floryan` / `floryan` (coach de demo)
- `corentin` / `corentin` (sportif suivi par floryan)

## CI GitLab / Jenkins

- `Jenkinsfile` : pipeline Jenkins avec validation Compose, build, healthchecks et tests d'acceptation Maven.
- `.gitlab-ci.yml` : pipeline GitLab CI equivalent pour un runner Docker.
- `docker-compose.ci.yml` : environnement ephemere utilise par la CI.

## Elements a exclure de l'archive

Ne pas inclure dans l'archive de rendu :

- `node_modules/`
- `.venv/`
- `dist/`
- volumes Docker et caches locaux
- `.git/`
- fichiers `.env` reels contenant des secrets

Les fichiers `.env.example` doivent rester dans l'archive car ils documentent la configuration attendue.
