# Checklist technique avant rendu

## Corrige ou reduit

- [x] Pile Docker developpement, production et CI definie.
- [x] Authentification appliquee aux routes utilisateur, mesure, module, session et IA.
- [x] Acces aux donnees filtre selon le role : sportif, coach, admin.
- [x] Coachs limites aux sportifs affectes pour les donnees sensibles.
- [x] Liste globale des sportifs visible cote coach avec distinction "mes sportifs".
- [x] Sportif informe de son coach referent dans le dashboard.
- [x] Administration : creation/modification utilisateurs, modules et affectation coach.
- [x] Analyse video transmise par WebSocket, stockee puis consultable.
- [x] Selection de l'exercice cote front : squat, developpe couche experimental, souleve de terre experimental.
- [x] Historique video filtre par utilisateur et perimetre coach.
- [x] Erreurs d'analyse video affichees cote frontend.
- [x] GPS : filtrage des sauts et vitesses aberrantes.
- [x] Pas : estimation accelerometre avec seuil adaptatif.
- [x] Fiabilite GPS/pas exposee dans les statistiques de seance.
- [x] Routes internes Java/API protegees par secret de service.
- [x] Sessions utilisateur avec access token court, refresh token long, rotation et logout serveur.

## Limites restantes a presenter honnetement

- L'analyse video squat est la plus fiable ; bench/deadlift sont des modes experimentaux a presenter comme extension du POC.
- La generation de plans personnalises par LLM reste une perspective, appuyee par le prototype LifterLens.
- Les donnees IA restent limitees : augmentation synthetique pour stabiliser la demo, mais pas modele sportif generalisable.
- La precision GPS et le comptage des pas dependent fortement du materiel et de la position du capteur.
- Le WebSocket d'analyse video reste accessible aux utilisateurs authentifies via le front, mais ne transporte pas encore directement le token dans le protocole WebSocket.
- Les secrets Docker de demonstration sont fournis dans les fichiers compose ; en production, ils doivent etre injectes par variables d'environnement securisees.

## A revalider avant depot

- [ ] Redemarrer toute la pile Docker.
- [ ] Tester `admin / admin` : affectation coach sur `test`.
- [ ] Tester `test / azer` : coach referent visible.
- [ ] Tester `coach / coach` : filtre "mes sportifs" et "tous les sportifs".
- [ ] Tester analyse video : resultat + historique.
- [ ] Tester une vraie session ESP32 et verifier la fiabilite GPS/pas affichee.
