Feature: Gestion des données via l'API

  Scenario: Stockage des résultats d'analyse
    Given une analyse a été effectuée
    When les résultats sont transmis à l'API
    Then les résultats sont stockés en base de données


  Scenario: Échec du stockage des données
    Given une analyse a été effectuée
    When le stockage échoue
    Then les données ne sont pas enregistrées
    And une erreur est signalée
