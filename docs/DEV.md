# Environnement de développement – TrackrAI

Ce document explique **comment lancer et utiliser TrackrAI en développement**  
sur **Windows (via WSL)** et **Linux**, sans Android Studio.

---

## Vue d’ensemble

### Services en dev

| Service          | Runtime     | Port | Remarque |
|------------------|-------------|------|---------|
| Frontend (Vue)   | Docker      | 5173 | Vite (hot reload) |
| API Trackr       | Docker      | 4567 | Node.js |
| MongoDB          | Docker      | 27017 | Base de données |
| Central Server   | IntelliJ    | 9000 | Java, hors Docker |
| Analyze Server   | Python      | 6000 | WebSocket analyse |
| Mobile (Android) | Capacitor   | —    | Accès au frontend dev |

---

## Prérequis

### Obligatoires
- Docker + Docker Compose
- Node.js ≥ 20
- Java (JDK géré par IntelliJ)
- Python ≥ 3.10 (venv pour AnalyzeServer)
- Téléphone Android avec **débogage USB activé**

### Optionnels
- WSL (pour Windows)
- adb (Android Debug Bridge)

---

## Lancement des services (DEV)

### 1. Démarrer les services Docker

À la racine du projet :

```bash
docker compose -f docker-compose.dev.yml up --build

Cela démarre :

* MongoDB
* API Trackr
* Frontend (Vite)

---

### 2. Démarrer le Central Server (Java)

Le **Central Server n’est pas dockerisé en dev**.

* Ouvrir `CentralServer` dans IntelliJ
* Lancer la classe principale :

```text
TrackrCentralServer 9000
```

Le serveur écoute sur :

```text
http://localhost:9000
```

---

### 3. Démarrer le Analyze Server (Python)

```bash
cd AnalyzeServer
python -m venv .venv
source .venv/bin/activate   # Linux / WSL
# ou .venv\Scripts\activate # Windows

pip install -r requirements.txt
python main.py
```

Le serveur WebSocket écoute sur :

```text
ws://localhost:6000
```

---

## Accès au Frontend

### Depuis le PC

```text
http://localhost:5173
```

---

### Depuis un téléphone (DEV live)

1. Récupérer l’IP locale du PC :

```bash
ip addr   # Linux / WSL
```

Exemple :

```text
192.168.1.20
```

2. Accéder au frontend depuis le téléphone :

```text
http://192.168.1.20:5173
```

---

## Communication Frontend ↔ API

### Principe (IMPORTANT)

Le frontend **n’utilise jamais d’IP d’API**.

Il utilise uniquement :

```text
/trackrapi
```

### En dev

* Vite proxy `/trackrapi` → `trackr-api:4567`

### En prod

* Nginx proxy `/trackrapi` → `trackr-api:4567`

➡️ **Même code en dev et en prod**

---

## Mobile (Capacitor – DEV sans Android Studio)

### Configuration Capacitor

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

⚠️ L’IP **n’est jamais commitée**
→ à adapter localement selon la machine

---

### Lancer l’app sur le téléphone

Téléphone branché en USB + débogage activé :

```bash
npx cap sync android
npx cap run android --target=device
```

➡️ L’app affiche **le frontend Vite en live**
➡️ Toute modification du frontend est visible instantanément

---

## WebSocket – Analyse vidéo

* Le frontend envoie la vidéo via WebSocket
* Le Analyze Server traite et renvoie :

  * score
  * erreurs biomécaniques
  * conseils

URL WebSocket en dev :

```text
ws://localhost:6000
```

Depuis mobile :

```text
ws://<IP_DU_PC>:6000
```
