# Développement TrackrAI

Ce document décrit l’installation et l’exécution locale de TrackrAI pour reprendre ou modifier le projet.

## Prérequis

| Outil | Version conseillée | Usage |
|---|---:|---|
| Git | récente | récupération du dépôt |
| Docker Engine | 24+ | conteneurisation des services |
| Docker Compose | v2 | orchestration locale |
| Node.js | 20 | API et frontend |
| Java JDK | 21 | serveur central |
| Python | 3.10 | serveur d’analyse vidéo et scripts IA |
| Maven | 3.x | tests d’acceptation |
| PlatformIO | compatible ESP32 | firmware ESP32 |
| Android Studio | récent | build Android Capacitor |

Pour l’ESP32, l’adresse du serveur central n’est pas codée en dur dans le firmware. Elle est configurée depuis le portail WiFiManager du boîtier, puis stockée en mémoire persistante.

## Récupération du dépôt

```bash
git clone https://gitlab.iut-bm.univ-fcomte.fr/fbornet/TrackrAI.git
cd TrackrAI
```

## Lancement complet avec Docker Compose

### Développement

```bash
docker compose -f docker-compose.dev.yml up --build
```

Accès :

| Service | URL / port |
|---|---|
| Frontend Vite | `http://localhost:5173` |
| API | `http://localhost:4567/trackrapi` |
| Swagger | `http://localhost:4567/trackrapi/api-docs` |
| Serveur central TCP | `localhost:29000` |
| Serveur d’analyse | `ws://localhost:6000` |
| MongoDB | `localhost:27017` |

Arrêt simple :

```bash
docker compose -f docker-compose.dev.yml down
```

Arrêt avec suppression du volume MongoDB :

```bash
docker compose -f docker-compose.dev.yml down -v
```

### Exécution locale de production

```bash
docker compose -f docker-compose.yml up --build -d
```

Accès :

| Service | URL / port |
|---|---|
| Frontend Nginx | `http://localhost:8080` |
| API via proxy | `http://localhost:8080/trackrapi` |
| Swagger via proxy | `http://localhost:8080/trackrapi/api-docs` |
| WebSocket via proxy | `ws://localhost:8080/ws` |
| Serveur central TCP | `localhost:29000` |

## Exécution sans Docker

### API Node.js

```bash
cd TrackrAPI
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r ai/requirements.txt
npm run dev
```

L’API écoute par défaut sur `http://localhost:4567/trackrapi`.

### Frontend Vue

```bash
cd WebTrackr
npm install
npm run dev
```

Le frontend écoute par défaut sur `http://localhost:5173`.

### Serveur central Java

```bash
cd CentralServer
javac -cp "lib/*" server/src/*.java client/src/*.java
java -cp "lib/*:server/src:client/src" TrackrCentralServer 29000
```

Sous Windows, remplacer `:` par `;` dans le classpath.

### Serveur d’analyse Python

```bash
cd AnalyzeServer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Le serveur d’analyse écoute par défaut sur `ws://localhost:6000`.

## Configuration du boîtier ESP32

Le firmware est situé dans `arduino/`. Il est prévu pour PlatformIO avec l’environnement `esp32dev`.

Au premier démarrage, le boîtier crée un point d’accès de configuration. Le portail WiFiManager demande :

- le SSID Wi-Fi ;
- le mot de passe Wi-Fi ;
- l’adresse IP ou le nom de la machine hébergeant le serveur central ;
- le port TCP du serveur central, généralement `29000`.

Le bouton BOOT maintenu pendant cinq secondes efface la configuration Wi-Fi, l’adresse du serveur et la clé du module.

## Application Android

```bash
cd WebTrackr
npm install
npm run build
npx cap sync android
npx cap open android
```

`capacitor.config.json` correspond à la configuration standard. `capacitor.config.dev.json` peut être utilisé pour pointer l’application Android vers le serveur Vite pendant le développement.

## Tests

Les tests d’acceptation s’exécutent depuis `TrackrAIAcceptanceTests` :

```bash
cd TrackrAIAcceptanceTests
mvn -B test
```

Variables utiles :

| Variable | Rôle | Valeur par défaut fréquente |
|---|---|---|
| `API_BASE_URL` | URL de l’API testée | `http://localhost:4567/trackrapi` |
| `CENTRAL_HOST` | hôte du serveur central | `localhost` |
| `CENTRAL_PORT` | port TCP du serveur central | `29000` |

## Intégration continue

Deux configurations sont présentes :

- `.gitlab-ci.yml` pour GitLab CI ;
- `Jenkinsfile` pour Jenkins.

Les deux pipelines utilisent `docker-compose.ci.yml`, construisent les services, vérifient leur disponibilité puis exécutent les tests Maven. Ils assurent l’intégration continue, mais ne déploient pas automatiquement l’application en production.

## Éléments à exclure d’une archive finale

```text
.idea/
.vscode/
*.iml
AnalyzeServer/dev/
TrackrAPI/ai/notebook/
node_modules/
dist/
target/
coverage/
*.log
```

Les fichiers `AnalyzeServer/dev/test_squat.mp4` et `AnalyzeServer/dev/ws_client_test.py` sont utiles pour des essais locaux, mais ne doivent pas être conservés dans une archive de rendu sauf justification explicite.

## Vérifications rapides avant rendu

```bash
docker compose -f docker-compose.dev.yml config
docker compose -f docker-compose.dev.yml up --build
curl http://localhost:4567/trackrapi/health
cd TrackrAIAcceptanceTests && mvn -B test
```