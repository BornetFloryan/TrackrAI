@ia
Feature: Génération de conseils personnalisés par l'IA

  Scenario: Génération de recommandations après analyse
    Given une séance existante avec l'identifiant "DEMO-TEST-1"
    And je suis authentifié
    When je demande des conseils personnalisés par l'IA
    Then le statut de la réponse IA doit être 200
    And une liste de conseils est retournée


