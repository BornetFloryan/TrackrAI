@ia
Feature: Analyse HRV par l'IA

  Scenario: Analyse HRV pour une séance avec données cardiaques
    Given une séance existante avec l'identifiant "session-hrv-1"
    When je demande l'analyse HRV par l'IA
    Then le statut de la réponse IA doit être 404

