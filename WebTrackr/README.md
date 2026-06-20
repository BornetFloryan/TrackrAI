# WebTrackr

WebTrackr est le frontend Vue/Capacitor de TrackrAI. Il fournit l’interface web et mobile utilisée par les profils sportif, coach et administrateur.

## Rôles de l’interface

- Sportif : démarrage de séance, consultation des mesures, statistiques, historique et analyses vidéo.
- Coach : suivi des sportifs affectés et consultation de leurs séances.
- Administrateur : gestion des utilisateurs, des modules et des affectations.

## Technologies

- Vue 3
- Vite
- Pinia
- Vue Router
- Axios
- Chart.js
- Leaflet
- Capacitor Android

## Installation

```bash
cd WebTrackr
npm install
```

## Lancement en développement

```bash
npm run dev
```

Par défaut, l’application est disponible sur :

```text
http://localhost:5173
```

L’API attendue est celle de TrackrAI, généralement disponible sur :

```text
http://localhost:4567/trackrapi
```

## Compilation web

```bash
npm run build
```

Les fichiers générés sont placés dans `dist/`.

## Application Android avec Capacitor

```bash
npm run build
npx cap sync android
npx cap open android
```

Le fichier `capacitor.config.json` correspond à la configuration standard. Le fichier `capacitor.config.dev.json` peut être utilisé pour connecter l’application Android au serveur Vite pendant le développement.

## Organisation du code

```text
src/views/        pages principales
src/components/   composants réutilisables, graphiques, cartes
src/services/     clients HTTP, authentification, vidéo et IA
src/store/        stores Pinia
src/router/       routes et gardes d’accès
src/utils/        fonctions d’adaptation et de calcul côté interface
```

## Communication avec les services

- HTTP/JWT vers l’API Node.js pour l’authentification, les séances, les mesures, les modules, les utilisateurs et l’IA.
- WebSocket vers le serveur Python pour l’envoi des vidéos et la réception du résultat d’analyse.
- `POST /analysis` vers l’API pour enregistrer le résultat de l’analyse vidéo avec le propriétaire correct.
