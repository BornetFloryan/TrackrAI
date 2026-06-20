# TrackrAI

TrackrAI est un proof of concept de suivi sportif combinant un boitier ESP32, une application web/mobile,
des statistiques de seance et une analyse video. Il fournit au sportif un suivi de ses mesures et au coach
une vue globale des performances.

Le projet repose sur une architecture distribuée composée :

- d’un frontend web/mobile hybride
- d’une API Node.js
- d’un serveur central (Java)
- d’un serveur d’analyse vidéo (Python, WebSocket)
- d’une base de données MongoDB

---

## 🎯 Fonctionnalités principales

- Upload de vidéo depuis le frontend (web ou mobile)
- Transmission de la vidéo via WebSocket
- Analyse automatique du mouvement (ex. squat)
- Acquisition GPS, inertielle et cardiaque par ESP32
- Gestion des seances et calcul de statistiques
- Prediction XGBoost et conseils de recuperation
- Interfaces distinctes sportif, coach et administrateur
- Retour immédiat :
  - prévision de la fréquence cardiaque moyenne de la prochaine séance comparable
  - erreurs détectées
  - conseils d’amélioration
- Stockage des résultats d’analyse en base de données
- Consultation ultérieure des analyses via l’API

---

## 🧱 Architecture générale

```
Frontend (Vue / Capacitor)
│
│ HTTP (/trackrapi)
▼
API Trackr (Node.js)
│
│ TCP
▼
Central Server (Java)
│
│ MongoDB
▼
Base de données
▲
│ TCP
Analyze Server (Python, WebSocket)
▲
│ WebSocket
Frontend (upload vidéo)
```

---

## 🖥️ Technologies utilisées

- **Frontend** : Vue 3, Vite, Capacitor
- **Backend API** : Node.js, Express
- **Central Server** : Java (TCP)
- **Analyse vidéo** : Python, WebSocket, OpenCV / MediaPipe
- **Base de données** : MongoDB
- **Conteneurisation** : Docker & Docker Compose
- **Reverse proxy (prod)** : Nginx

---

## 🧪 Environnements

- **Développement** : Docker Compose (`docker-compose.dev.yml`)
- **Production** : Docker Compose (`docker-compose.yml`)

👉 Le code applicatif est identique en développement et en production.
👉 Seule la configuration Docker (réseau, proxy, build frontend) diffère.

---

## 🧑‍💻 Développement (Linux & WSL)

Le projet est conçu pour fonctionner de manière identique sur :

- Linux natif
- Windows avec WSL 2

Le mode développement repose exclusivement sur Docker Compose v2.

### 📡 Module ESP32 : reset et connexion

L'ESP32 utilise WiFiManager pour configurer le WiFi et l'adresse du serveur TrackrAI.

Pour refaire une configuration propre de l'ESP32 :

1. Allumer l'ESP32.
2. Maintenir le bouton **BOOT** environ 5 secondes au démarrage.
3. Attendre le message de reset dans le moniteur série.
4. Se connecter depuis un téléphone ou un PC au WiFi créé par l'ESP32 :

```text
Trackr-ESP32
```

5. Dans le portail WiFiManager, choisir le WiFi de la salle/du PC et renseigner le serveur :

```text
Server host : adresse IP de la machine qui lance Docker
Server port : 29000
```

Exemple :

```text
Server host : 192.168.31.100
Server port : 29000
```

6. Valider. L'ESP32 sauvegarde le WiFi, l'adresse du serveur et sa clé module en mémoire flash.

En développement comme en production locale, l'ESP32 communique avec le serveur central Java exposé sur le port `29000`.
---

## 👥 Équipe

Projet réalisé dans le cadre d’une SAE par :

- Floryan Bornet
- Corentin Brendle
- Gauthier Weibel
- Ludovic Ertzer
- Simon Bonnin

---

## ⚠️ Remarques importantes

- Le frontend **n’utilise jamais d’IP codée en dur**
- En développement, le frontend consomme directement l’API exposée par Docker
- En production, les accès API et WebSocket sont gérés via un reverse proxy Nginx
- Le mode mobile en développement repose sur un affichage du frontend Vite en live
