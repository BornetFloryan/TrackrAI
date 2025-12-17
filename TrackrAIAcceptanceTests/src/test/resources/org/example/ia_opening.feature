Feature: Coup d'ouverture par l'IA

  Scenario: L'IA joue au centre si disponible
    Given une grille vide
    When c'est au tour de l'IA
    Then l'IA place un pion au centre

  Scenario: L'IA joue dans un coin si le centre est occupé
    Given une grille avec le centre occupé
    When c'est au tour de l'IA
    Then l'IA place un pion dans un coin