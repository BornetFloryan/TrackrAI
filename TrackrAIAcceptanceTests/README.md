# Tests d’acceptation TrackrAI

Ce module contient les tests d’acceptation Maven/Cucumber de TrackrAI. Ils vérifient les comportements principaux de l’API, du serveur central Java et de certaines fonctions IA.

## Prérequis

- Java JDK 21
- Maven 3.x
- API TrackrAI accessible
- MongoDB initialisée
- Serveur central Java accessible pour les scénarios TCP

Le moyen le plus simple consiste à lancer la pile de développement avant les tests :

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Exécution

Depuis la racine du dépôt :

```bash
cd TrackrAIAcceptanceTests
mvn -B test
```

## Variables d’environnement

| Variable       | Rôle                        | Valeur par défaut fréquente       |
| -------------- | --------------------------- | --------------------------------- |
| `API_BASE_URL` | URL de l’API testée         | `http://localhost:4567/trackrapi` |
| `CENTRAL_HOST` | hôte du serveur central     | `localhost`                       |
| `CENTRAL_PORT` | port TCP du serveur central | `29000`                           |

Exemple :

```bash
API_BASE_URL=http://localhost:4567/trackrapi \
CENTRAL_HOST=localhost \
CENTRAL_PORT=29000 \
mvn -B test
```

## Scénarios couverts

- Authentification : connexion valide, mot de passe incorrect, utilisateur courant.
- Modules : auto-enregistrement, connexion et consultation.
- Mesures : création, rejet hors session ou données invalides, consultation filtrée.
- Utilisateurs : consultation sans exposition des champs sensibles.
- Serveur central : commandes TCP, erreurs de protocole, connexions simultanées.
- Analyse vidéo : stockage d’un résultat d’analyse.
- IA : entraînement, prévision cardiaque, évaluation et recommandations.

## Organisation

```text
src/test/resources/     fichiers .feature Cucumber
src/test/java/          steps, hooks et contextes de test
```

## Intégration continue

Les pipelines GitLab CI et Jenkins lancent ces tests après construction et démarrage des services avec `docker-compose.ci.yml`.
