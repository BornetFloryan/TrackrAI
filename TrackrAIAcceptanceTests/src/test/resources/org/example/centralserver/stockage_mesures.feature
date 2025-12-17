Feature: Stockage de mesures capteurs

  Scenario: Enregistrement d'une mesure valide
    Given un module est déjà enregistré
    When une requête STOREMEASURE valide est envoyée
    Then la mesure est stockée

  Scenario: Mesure avec paramètres invalides
    Given un module est déjà enregistré
    When une requête STOREMEASURE invalide est envoyée
    Then la mesure est refusée
    And une erreur STOREMEASURE invalide est retournée
