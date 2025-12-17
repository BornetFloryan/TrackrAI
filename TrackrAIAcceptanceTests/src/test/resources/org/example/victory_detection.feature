Feature: Détection de victoire

  Scenario: Victoire par ligne horizontale
    Given une grille vide
    When le joueur place un pion en (1,1)
    And le joueur place un pion en (2,2)
    And le joueur place un pion en (1,2)
    And le joueur place un pion en (2,3)
    And le joueur place un pion en (1,3)
    Then le joueur gagne la manche

  Scenario: Victoire par ligne verticale
    Given une grille vide
    When le joueur place un pion en (1,1)
    And le joueur place un pion en (2,2)
    And le joueur place un pion en (2,1)
    And le joueur place un pion en (2,3)
    And le joueur place un pion en (3,1)
    Then le joueur gagne la manche

  Scenario: Victoire par ligne diagonale
    Given une grille vide
    When le joueur place un pion en (1,1)
    And le joueur place un pion en (3,2)
    And le joueur place un pion en (2,2)
    And le joueur place un pion en (3,1)
    And le joueur place un pion en (3,3)
    Then le joueur gagne la manche

  Scenario: Partie nulle
    Given une grille pleine sans gagnant
    Then la manche est déclarée nulle
