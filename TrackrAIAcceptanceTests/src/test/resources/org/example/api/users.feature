Feature: Gestion des utilisateurs

  Scenario: Création d'un utilisateur avec login existant
    Given l'API Trackr est disponible
    When je crée un utilisateur avec un login déjà existant
    Then le code HTTP est 403

  Scenario: Consultation des utilisateurs
    Given l'API Trackr est disponible
    And je suis authentifié
    When je demande la liste des utilisateurs
    Then le code HTTP est 200
    And une liste d'utilisateurs est retournée
