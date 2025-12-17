Feature: Stratégie de placement de pion par l'IA

  Scenario: L'IA bloque une victoire imminente si elle ne peut pas gagner
    Given une grille avec deux pions alignés
    When c'est au tour de l'IA
    Then l'IA place un pion pour bloquer la victoire

  Scenario: L'IA joue un coup gagnant
    Given une grille avec deux pions alignés pour l'IA
    When c'est au tour de l'IA
    Then l'IA place un pion pour gagner la manche