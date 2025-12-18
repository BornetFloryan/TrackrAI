@ia
Feature: Estimation de la fatigue cycliste par l'IA

  Scenario: Estimation de la fatigue pour une séance existante
    Given une séance existante avec l'identifiant "session-fatigue-1"
    When je demande l'estimation de la fatigue par l'IA
    Then le statut de la réponse IA doit être 404

