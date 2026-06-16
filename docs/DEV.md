# Environnement de développement – TrackrAI

Ce document explique comment lancer TrackrAI **en développement**, avec **tous les services Dockerisés**,
sur Windows (WSL recommandé) ou Linux.

Aucune installation d’Android Studio n’est requise.

---

## 🧱 Vue d’ensemble – Services en DEV

| Service           | Runtime | Port | Remarque |
|------------------|--------|------|---------|
| Frontend (Vue)   | Docker | 5173 | Vite + hot reload |
| API Trackr       | Docker | 4567 | Node.js |
| Central Server   | Docker | 9000 | TCP (Java) |
| Analyze Server   | Docker | 6000 | WebSocket (Python) |
| MongoDB          | Docker | 27017 | Base de données |
| Mobile (Android) | Capacitor | — | Affichage du frontend dev |

---

## ✅ Prérequis

### Obligatoires
- Docker ≥ 24
- Docker Compose v2 (`docker compose`)
- Git

### Sous Windows
- Docker Desktop
- WSL 2 avec intégration Docker activée

Aucune redirection réseau manuelle (portproxy, pare-feu) n’est nécessaire.

---

## ▶️ Lancement de l’environnement DEV

À la racine du projet :

```bash
docker compose -f docker-compose.dev.yml up --build
````

Cela démarre automatiquement :

* MongoDB
* API Trackr
* Central Server
* Analyze Server
* Frontend (Vite)

---

## 🌐 Accès aux services

### Depuis le PC

* Frontend : [http://localhost:5173](http://localhost:5173)
* API : [http://localhost:4567/trackrapi](http://localhost:4567/trackrapi)

### Depuis un téléphone (DEV live)

1. Récupérer l’IP locale du PC :

```bash
ip addr
```

Exemple :

```
192.168.1.20
```

2. Accéder au frontend :

```
http://192.168.1.20:5173
```

---

## 🔁 Communication Frontend ↔ API

### Principe clé (IMPORTANT)

Le frontend **n’utilise jamais d’IP fixe pour l’API**.

Il utilise uniquement :

```
/trackrapi
```

### En développement

* Vite proxy :

```
/trackrapi → trackr-api:4567
/ws        → analyze:6000
```

### En production

* Nginx proxy :

```
/trackrapi → trackr-api:4567
/ws        → analyze:6000
```

➡️ Même code frontend en dev et en prod.

---

## 🎥 Analyse vidéo (WebSocket)

### Fonctionnement

1. Le frontend ouvre une connexion WebSocket
2. Envoie :

   * START_ANALYSIS
   * VIDEO_CHUNK (base64)
   * END_ANALYSIS
3. Le serveur d’analyse :

   * traite la vidéo
   * renvoie le résultat
   * transmet l’analyse au Central Server
4. Le frontend récupère le résultat via l’API

### URL WebSocket en DEV

* Depuis le PC :

```
ws://localhost:6000
```

* Depuis un téléphone :

```
ws://<IP_DU_PC>:6000
```

---

## 📱 Mobile – Capacitor (DEV sans Android Studio)

### Configuration locale (non commitée)

`capacitor.config.json` :

```json
{
  "appId": "com.trackrai.app",
  "appName": "TrackrAI",
  "webDir": "dist",
  "server": {
    "url": "http://<IP_DU_PC>:5173",
    "cleartext": true
  }
}
```

⚠️ L’IP dépend de la machine → ne jamais commit ce fichier modifié.

---

### Lancer l’application sur le téléphone

Téléphone branché en USB :

```bash
npx cap sync android
npx cap run android --target=device
```

➡️ L’application affiche le frontend Vite **en live**
➡️ Toute modification du frontend est visible instantanément

---

## 🧪 Vérification rapide

* ✔️ Accès frontend PC
* ✔️ Accès frontend téléphone
* ✔️ Upload vidéo
* ✔️ Analyse reçue
* ✔️ Données stockées en MongoDB
* ✔️ Récupération via l’API

---

## 🛑 Arrêt des services

```bash
docker compose -f docker-compose.dev.yml down
```

Aucune installation d’Android Studio n’est requise.

---

## 🧱 Vue d’ensemble – Services en DEV

| Service           | Runtime | Port | Remarque |
|------------------|--------|------|---------|
| Frontend (Vue)   | Docker | 5173 | Vite + hot reload |
| API Trackr       | Docker | 4567 | Node.js |
| Central Server   | Docker | 9000 | TCP (Java) |
| Analyze Server   | Docker | 6000 | WebSocket (Python) |
| MongoDB          | Docker | 27017 | Base de données |
| Mobile (Android) | Capacitor | — | Affichage du frontend dev |

---

## ✅ Prérequis

### Obligatoires
- Docker
- Docker Compose
- Node.js ≥ 20
- Téléphone Android avec débogage USB activé

### Optionnels
- WSL (recommandé sous Windows)
- `adb` (Android Debug Bridge)

---

## ▶️ Lancement de l’environnement DEV

À la racine du projet :

```bash
docker compose -f docker-compose.dev.yml up --build
````

Cela démarre automatiquement :

* MongoDB
* API Trackr
* Central Server
* Analyze Server
* Frontend (Vite)

---

## 🌐 Accès aux services

### Depuis le PC

* Frontend : [http://localhost:5173](http://localhost:5173)
* API : [http://localhost:4567/trackrapi](http://localhost:4567/trackrapi)

### Depuis un téléphone (DEV live)

1. Récupérer l’IP locale du PC :

```bash
ip addr
```

Exemple :

```
192.168.1.20
```

2. Accéder au frontend :

```
http://192.168.1.20:5173
```

---

## 🔁 Communication Frontend ↔ API

### Principe clé (IMPORTANT)

Le frontend **n’utilise jamais d’IP fixe pour l’API**.

Il utilise uniquement :

```
/trackrapi
```

### En développement

* Vite proxy :

```
/trackrapi → trackr-api:4567
/ws        → analyze:6000
```

### En production

* Nginx proxy :

```
/trackrapi → trackr-api:4567
/ws        → analyze:6000
```

➡️ Même code frontend en dev et en prod.

---

## 🎥 Analyse vidéo (WebSocket)

### Fonctionnement

1. Le frontend ouvre une connexion WebSocket
2. Envoie :

   * START_ANALYSIS
   * VIDEO_CHUNK (base64)
   * END_ANALYSIS
3. Le serveur d’analyse :

   * traite la vidéo
   * renvoie le résultat
   * transmet l’analyse au Central Server
4. Le frontend récupère le résultat via l’API

### URL WebSocket en DEV

* Depuis le PC :

```
ws://localhost:6000
```

* Depuis un téléphone :

```
ws://<IP_DU_PC>:6000
```

---

## 📱 Mobile – Capacitor (DEV sans Android Studio)

### Configuration locale (non commitée)

`capacitor.config.json` :

```json
{
  "appId": "com.trackrai.app",
  "appName": "TrackrAI",
  "webDir": "dist",
  "server": {
    "url": "http://<IP_DU_PC>:5173",
    "cleartext": true
  }
}
```

⚠️ L’IP dépend de la machine → ne jamais commit ce fichier modifié.

---

### Lancer l’application sur le téléphone

Téléphone branché en USB :

```bash
npx cap sync android
npx cap run android --target=device
```

➡️ L’application affiche le frontend Vite **en live**
➡️ Toute modification du frontend est visible instantanément

---

## 🧪 Vérification rapide

* ✔️ Accès frontend PC
* ✔️ Accès frontend téléphone
* ✔️ Upload vidéo
* ✔️ Analyse reçue
* ✔️ Données stockées en MongoDB
* ✔️ Récupération via l’API

---

## 🛑 Arrêt des services

```bash
docker compose -f docker-compose.dev.yml down
```
