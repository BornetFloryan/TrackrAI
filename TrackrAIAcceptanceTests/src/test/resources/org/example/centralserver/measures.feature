@central
Feature: Stockage des mesures

  Scenario: Mesure valide
    Given le serveur central est accessible
    When le client envoie AUTOREGISTER valide
    Then le serveur confirme l'enregistrement
    When le client s'identifie avec HELLO
    Then le serveur accepte l'identification
    When le client envoie une mesure valide
    Then la mesure est acceptée

  Scenario: Mesure invalide
    Given le serveur central est accessible
    When le client envoie une mesure invalide
    Then la mesure est refusée
