Feature: Gestion des mesures

  Scenario: Création d'une mesure avec un module inexistant
    Given l'API Trackr est disponible
    When j'envoie une mesure valide
    Then le code HTTP est 500

  Scenario: Création d'une mesure sans type
    Given l'API Trackr est disponible
    When j'envoie une mesure sans type
    Then le code HTTP est 400

  Scenario: Consultation des mesures
    Given l'API Trackr est disponible
    When je demande les mesures
    Then le code HTTP est 200
    And une liste de mesures est retournée
