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

👉 Le code applicatif est identique en dev et en prod.  
Seule la configuration Docker diffère.

---

## 📚 Documentation

- 📄 **Développement** : [`docs/DEV.md`](docs/DEV.md)

---

## 👥 Équipe

Projet réalisé dans le cadre d’une SAE de Semestre 5 par :

- Floryan Bornet  
- Corentin Brendle  
- Gauthier Wable  
- Ludovic Ertzer  
- Simon Bonnin  

---

## ⚠️ Remarques importantes

- Le frontend **n’utilise jamais d’IP codée en dur** pour l’API
- Toutes les communications passent par des proxys (`/trackrapi`, WebSocket)
- Le mode mobile en développement repose sur un affichage du frontend Vite en live
```
