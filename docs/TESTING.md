# Validation technique

## Tests manuels prioritaires

1. Lancer la pile :

```powershell
docker compose -f docker-compose.dev.yml up --build
```

2. Tester les roles :

- `admin / admin` : gestion utilisateurs/modules et affectation coach ;
- `coach / coach` : filtre "mes sportifs" / "tous les sportifs" ;
- `test / azer` : dashboard sportif et coach referent.

3. Tester la video :

- upload d'une video ;
- analyse ;
- stockage ;
- consultation dans `/analyses`.

4. Tester le materiel :

- ESP32 connecte au port `29000` ;
- demarrage seance ;
- mesures ;
- arret seance ;
- verification des statistiques et de la fiabilite GPS/pas.

## Tests automatiques

```powershell
cd TrackrAIAcceptanceTests
mvn test
```

## Points a verifier en demonstration

- Les anciennes analyses creees avant l'ajout du `userId` peuvent ne pas apparaitre pour un sportif.
- Les sessions anciennes peuvent ne pas contenir les nouveaux indicateurs `quality`.
- Une nouvelle session calcule les indicateurs de fiabilite GPS/pas.
