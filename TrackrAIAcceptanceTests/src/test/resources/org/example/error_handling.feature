Feature: Gestion des erreurs

  Scenario: Placement dans une case déjà occupée
    Given une grille avec le centre occupé
    When le joueur place un pion au centre
    Then une erreur est levée indiquant que la case est déjà occupée

  Scenario: Placement en dehors des limites de la grille
    Given une grille vide
    When le joueur place un pion en (4,1)
    Then une erreur est levée indiquant que le placement est invalide