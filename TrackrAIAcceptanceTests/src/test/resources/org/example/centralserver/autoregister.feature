@central
Feature: Auto-enregistrement microcontrôleur

  Scenario: Enregistrement valide
    Given le serveur central est accessible
    When le client envoie AUTOREGISTER valide
    Then le serveur confirme l'enregistrement
    When le client s'identifie avec HELLO
    Then le serveur accepte l'identification

  Scenario: Enregistrement invalide
    Given le serveur central est accessible
    When le client envoie AUTOREGISTER invalide
    Then le serveur retourne une erreur d'enregistrement
