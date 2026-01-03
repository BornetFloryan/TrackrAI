@central
Feature: Erreurs de protocole

  Scenario: Commande inconnue
    Given le serveur central est accessible
    When une commande inconnue est envoyée
    Then le serveur retourne une erreur de protocole
