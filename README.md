# TrackrAI

TrackrAI est une plateforme distribuée de suivi et d’analyse de performance sportive. Elle associe un boîtier d’acquisition ESP32, une API Node.js, un serveur central Java, une base MongoDB, un serveur Python d’analyse vidéo et un frontend Vue/Capacitor.

## Fonctionnalités principales

- Acquisition de mesures sportives depuis un boîtier ESP32 : GPS, fréquence cardiaque, RMSSD, accélération, gyroscope et compteur de pas.
- Centralisation des mesures par un serveur Java TCP multi-clients.
- Persistance dans MongoDB via une API Node.js/Express.
- Interface web et mobile Vue/Capacitor pour les profils sportif, coach et administrateur.
- Historique des séances, statistiques, carte GPS et suivi coach.
- Analyse vidéo d’exercices sportifs par WebSocket, OpenCV et MediaPipe.
- Prévision cardiaque avec XGBoost pour estimer la fréquence cardiaque moyenne attendue lors de la prochaine séance comparable.
- Tests d’acceptation Maven/Cucumber.
- Intégration continue avec GitLab CI et Jenkins.

## Architecture

```text
ESP32 + capteurs
  | TCP mesures
  v
Serveur central Java
  | HTTP interne x-service-secret
  v
API Node.js / Express ---- Mongoose ---- MongoDB 6.0
  ^
  | HTTP JSON / JWT + POST /analysis
Frontend Vue / Capacitor
  |
  | WebSocket vidéo / progression / résultat
  v
Serveur d’analyse Python
  | TCP STOREANALYSIS historique
  v
Serveur central Java
```

Le stockage principal des mesures passe par l’API. Le serveur central conserve un accès direct historique à MongoDB pour certains résultats d’analyse vidéo, mais la voie à privilégier reste l’enregistrement par l’API avec `POST /analysis`.

## Composants du dépôt

```text
arduino/                    Firmware ESP32 PlatformIO
CentralServer/              Serveur central Java TCP
TrackrAPI/                  API Node.js, modèles MongoDB, Swagger et IA
AnalyzeServer/              Serveur Python d’analyse vidéo WebSocket
WebTrackr/                  Frontend Vue et application Android Capacitor
TrackrAIAcceptanceTests/    Tests d’acceptation Maven/Cucumber
docs/                       Documentation CI GitLab/Jenkins
```

## Lancement rapide en développement

```bash
git clone https://gitlab.iut-bm.univ-fcomte.fr/fbornet/TrackrAI.git
cd TrackrAI
docker compose -f docker-compose.dev.yml up --build
```

Services exposés :

| Service                     | URL / port                                 |
| --------------------------- | ------------------------------------------ |
| Frontend Vite               | `http://localhost:5173`                    |
| API                         | `http://localhost:4567/trackrapi`          |
| Swagger                     | `http://localhost:4567/trackrapi/api-docs` |
| Serveur central TCP         | `localhost:29000`                          |
| Serveur d’analyse WebSocket | `ws://localhost:6000`                      |
| MongoDB                     | `localhost:27017`                          |

## Exécution locale de production

```bash
docker compose -f docker-compose.yml up --build -d
```

Accès principaux :

| Service             | URL / port                                 |
| ------------------- | ------------------------------------------ |
| Frontend Nginx      | `http://localhost:8080`                    |
| API via proxy       | `http://localhost:8080/trackrapi`          |
| Swagger via proxy   | `http://localhost:8080/trackrapi/api-docs` |
| WebSocket via proxy | `ws://localhost:8080/ws`                   |
| Serveur central TCP | `localhost:29000`                          |

## Boîtier ESP32

Le firmware se trouve dans `arduino/`. Le projet PlatformIO utilise l’environnement `esp32dev`.

Au premier démarrage ou après réinitialisation, le boîtier ouvre un portail WiFiManager. Ce portail permet de configurer :

- le SSID Wi-Fi ;
- le mot de passe Wi-Fi ;
- l’adresse de la machine qui héberge les services Docker ;
- le port du serveur central, généralement `29000`.

Le bouton BOOT maintenu pendant cinq secondes efface la configuration réseau et la clé du module.

## Tests d’acceptation

```bash
cd TrackrAIAcceptanceTests
mvn -B test
```

Les tests supposent que l’API, MongoDB et le serveur central sont accessibles. Les variables `API_BASE_URL`, `CENTRAL_HOST` et `CENTRAL_PORT` permettent d’adapter l’environnement.

## Documentation utile

- `DEV.md` : installation détaillée, exécution sans Docker et vérifications.
- `docs/CI_GITLAB_JENKINS.md` : fonctionnement de GitLab CI et Jenkins.
- `TrackrAPI/ai/EXTERNAL_DATA.md` : préparation des données PAMAP2 utilisées par la prévision cardiaque.
- Swagger : `http://localhost:4567/trackrapi/api-docs` en développement.
