Feature: Gestion des mesures

  Scenario: Mesure reçue sans session active
    Given l'API Trackr est disponible
    When j'envoie une mesure valide
    Then le code HTTP est 200
    And la mesure est explicitement ignorée

  Scenario: Création d'une mesure sans type
    Given l'API Trackr est disponible
    When j'envoie une mesure sans type
    Then le code HTTP est 400

  Scenario: Consultation des mesures
    Given l'API Trackr est disponible
    And je suis authentifié
    When je demande les mesures
    Then le code HTTP est 200
    And une liste de mesures est retournée

  Scenario: Consultation de l'historique des analyses vidéo
    Given l'API Trackr est disponible
    And je suis authentifié
    When je demande les analyses vidéo
    Then le code HTTP est 200
    And une liste d'analyses vidéo est retournée
