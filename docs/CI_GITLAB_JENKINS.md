# Intégration continue GitLab / Jenkins

## Objectif

Le projet contient deux configurations d'intégration continue :

- `Jenkinsfile` : pipeline prévu pour un Jenkins raccordé au dépôt Git ;
- `.gitlab-ci.yml` : pipeline GitLab CI équivalent, utile si le dépôt est hébergé sur GitLab.

Les deux pipelines utilisent `docker-compose.ci.yml` afin de construire et lancer les services dans un environnement isolé.

## Pipeline Jenkins

Le `Jenkinsfile` réalise les étapes suivantes :

1. récupération du dépôt ;
2. validation du fichier `docker-compose.ci.yml` ;
3. construction et démarrage des conteneurs ;
4. vérification de l'API et du frontend ;
5. exécution des tests d'acceptation Maven ;
6. arrêt et suppression des conteneurs/volumes de CI.

Pour brancher Jenkins sur GitLab, il faut créer un job Pipeline dans Jenkins et indiquer le dépôt GitLab comme source SCM. Le job doit pointer vers le fichier `Jenkinsfile` situé à la racine du dépôt.

## Pipeline GitLab CI

Le fichier `.gitlab-ci.yml` propose trois étapes :

- `validate` : vérifie la validité du compose CI ;
- `build` : construit les images Docker ;
- `test` : lance la pile, vérifie les services et exécute les tests Maven.

Le runner GitLab doit pouvoir exécuter Docker et Docker Compose. Le tag `docker` peut être adapté selon la configuration du runner du département.

## Variables importantes

- `API_BASE_URL=http://localhost:4567/trackrapi`
- `CENTRAL_HOST=localhost`
- `CENTRAL_PORT=29000`
- `COMPOSE_PROJECT_NAME=trackrai-ci`

Les secrets applicatifs utilisés en CI sont définis dans `docker-compose.ci.yml`. En production réelle, ils doivent être remplacés par des variables protégées dans GitLab/Jenkins.
