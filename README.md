# TrackrAI

TrackrAI est une application de suivi et d’analyse de mouvements sportifs basée sur l’analyse vidéo.
L’objectif est de permettre à un utilisateur de déposer une vidéo d’un mouvement (ex. squat) et d’obtenir
un retour automatique (score, erreurs biomécaniques, conseils). 

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
- Retour immédiat :
  - score global
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

### Prérequis

- Docker ≥ 24
- Docker Compose v2 (`docker compose`)
- Git

Sous Windows, Docker Desktop doit être utilisé avec l’intégration WSL activée.

### Lancement du projet

Depuis la racine du dépôt :

```bash
docker compose -f docker-compose.dev.yml up --build
````

Les services exposés en développement sont :

* Frontend (Vite) : [http://localhost:5173](http://localhost:5173)
* API Trackr (Node.js) : [http://localhost:4567](http://localhost:4567)
* Central Server (TCP) : port 29000
* MongoDB : port 27017

### Arrêt des services

```bash
docker compose down
```

### Réinitialisation complète (optionnel)

```bash
docker compose down -v
```

⚠️ Cette commande supprime également les données MongoDB.

---

### 📡 Modules externes (ESP, capteurs)

Les modules externes (ex. ESP32) communiquent directement avec le Central Server
via une connexion TCP persistante.

Configuration typique côté module :

- **Server host** : adresse IP de la machine exécutant Docker
- **Server port** : `29000`

Aucune configuration spécifique à Docker ou à l’OS n’est nécessaire côté module.

---

## 📚 Documentation

- 📄 **Développement** : [`docs/DEV.md`](docs/DEV.md)

---

## 👥 Équipe

Projet réalisé dans le cadre d’une SAE de Semestre 5 par :

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
