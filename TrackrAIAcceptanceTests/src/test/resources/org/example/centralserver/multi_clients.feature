@central
Feature: Multi-clients

  Scenario: Connexion simultanée
    Given le serveur central est accessible
    When deux clients TCP se connectent
    Then les deux connexions sont acceptées
