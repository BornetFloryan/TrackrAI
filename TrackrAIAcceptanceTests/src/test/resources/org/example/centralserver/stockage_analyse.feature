Feature: Stockage des résultats d'analyse

  Scenario: Enregistrement d'une analyse valide
    Given le serveur central est disponible
    When une requête STOREANALYSIS valide est envoyée
    Then l'analyse est stockée

  Scenario: Analyse avec paramètres manquants
    Given le serveur central est disponible
    When une requête STOREANALYSIS invalide est envoyée
    Then une erreur paramètres manquants est retournée
