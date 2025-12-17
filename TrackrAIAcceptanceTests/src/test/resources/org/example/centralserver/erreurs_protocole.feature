Feature: Gestion des erreurs de protocole

  Scenario: Commande inconnue
    Given un client TCP est connecté
    When une commande inconnue est envoyée
    Then une erreur de protocole est retournée

  Scenario: Commande vide
    Given un client TCP est connecté
    When une requête vide est envoyée
    Then la connexion est ignorée
