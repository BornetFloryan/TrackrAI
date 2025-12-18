Feature: Gestion des modules

  Scenario: Enregistrement automatique d'un module
    Given l'API Trackr est disponible
    When j'enregistre un module avec un µC et des chipsets valides
    Then le code HTTP est 201
    And une clé de module est générée

  Scenario: Récupération des modules
    Given l'API Trackr est disponible
    When je demande la liste des modules
    Then le code HTTP est 200
    And une liste de modules est retournée
