@ia
Feature: Génération de conseils personnalisés par l'IA

  Scenario: Génération de recommandations après analyse
    Given une séance existante avec l'identifiant "session-advice-1"
    When je demande des conseils personnalisés par l'IA
    Then le statut de la réponse IA doit être 404


