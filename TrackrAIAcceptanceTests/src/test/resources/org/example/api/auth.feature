Feature: Authentification API

  Scenario: Connexion réussie
    Given l'API Trackr est disponible
    When je me connecte avec un login valide et un mot de passe valide
    Then le code HTTP est 200
    And un token de session est retourné

  Scenario: Mot de passe incorrect
    Given l'API Trackr est disponible
    When je me connecte avec un login valide et un mot de passe invalide
    Then le code HTTP est 401
