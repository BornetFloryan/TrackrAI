@ia
Feature: Prédiction du score de performance par l'IA

  Scenario: Prédiction documentée pour une séance existante
    Given une séance existante avec l'identifiant "DEMO-TEST-1"
    And je suis authentifié
    When je demande la prédiction du score par l'IA
    Then le statut de la réponse IA doit être 200
    And une prédiction de performance est retournée
